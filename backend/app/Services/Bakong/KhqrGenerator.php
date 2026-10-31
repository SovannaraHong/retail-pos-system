<?php

namespace App\Services\Bakong;

use InvalidArgumentException;


//2
//KhqrGenerator – Generates a KHQR payment QR code containing merchant information, amount, currency, and expiry time.
//Also generates the MD5 hash for payment verification.
class KhqrGenerator
{
    private const CURRENCY_CODES = [
        'KHR' => '116',
        'USD' => '840'
    ];


    public function generate(array $o): array
    {
        $type     = strtolower((string) ($o['account_type'] ?? 'individual'));
        $currency = strtoupper((string) ($o['currency'] ?? ''));
        $amount   = $o['amount'] ?? null;
        $dynamic  = $amount !== null;

        if (! isset(self::CURRENCY_CODES[$currency])) {
            throw new InvalidArgumentException('Currency must be USD or KHR.');
        }

        if (empty($o['account_id']) || empty($o['merchant_name'])) {
            throw new InvalidArgumentException('Bakong account id and merchant name are required.');
        }

        if ($dynamic && (float) $amount <= 0) {
            throw new InvalidArgumentException('Amount must be greater than zero.');
        }

        if ($dynamic && empty($o['expires_at_ms'])) {
            throw new InvalidArgumentException('A dynamic KHQR (with amount) needs an expiry time.');
        }

        // ---- account information (tag 29 individual, tag 30 merchant)
        $account = $this->tlv('00', $this->cut($o['account_id'], 32));

        if ($type === 'merchant') {
            if (empty($o['merchant_id']) || empty($o['acquiring_bank'])) {
                throw new InvalidArgumentException('Merchant accounts need
                merchant_id and acquiring_bank.');
            }
            $account .= $this->tlv('01', $this->cut($o['merchant_id'], 32));
            $account .= $this->tlv('02', $this->cut($o['acquiring_bank'], 32));
        }

        // ---- main body, in the order the standard requires
        $qr  = $this->tlv('00', '01');                              // payload format
        $qr .= $this->tlv('01', $dynamic ? '12' : '11');            // 12 = dynamic, 11 = static
        $qr .= $this->tlv($type === 'merchant' ? '30' : '29', $account);
        $qr .= $this->tlv('52', '5999');                            // merchant category
        $qr .= $this->tlv('53', self::CURRENCY_CODES[$currency]);

        if ($dynamic) {
            $qr .= $this->tlv('54', $this->formatAmount((float) $amount, $currency));
        }

        $qr .= $this->tlv('58', 'KH');
        $qr .= $this->tlv('59', $this->cut($o['merchant_name'], 25));
        $qr .= $this->tlv('60', $this->cut($o['merchant_city'] ?? 'Phnom Penh', 15));

        // ---- additional data (tag 62)
        $extra = '';
        foreach (['01' => 'bill_number', '02' => 'mobile_number', '03' => 'store_label', '07' => 'terminal_label', '08' => 'purpose'] as $sub => $key) {
            if (! empty($o[$key])) {
                $extra .= $this->tlv($sub, $this->cut((string) $o[$key], 25));
            }
        }
        if ($extra !== '') {
            $qr .= $this->tlv('62', $extra);
        }

        // ---- timestamps (tag 99): created, and expiry for dynamic codes
        $stamps = $this->tlv('00', (string) $o['created_at_ms']);
        if ($dynamic) {
            $stamps .= $this->tlv('01', (string) $o['expires_at_ms']);
        }
        $qr .= $this->tlv('99', $stamps);

        // ---- checksum over everything including "6304"
        $qr .= '6304';
        $qr .= $this->crc16($qr);

        return ['qr' => $qr, 'md5' => md5($qr)];
    }

    // EMV length is the BYTE length of the value
    private function tlv(string $tag, string $value): string
    {
        $length = strlen($value);

        if ($length > 99) {
            throw new InvalidArgumentException("KHQR field {$tag} is too long.");
        }

        return $tag . str_pad((string) $length, 2, '0', STR_PAD_LEFT) . $value;
    }

    private function cut(string $value, int $max): string
    {
        return mb_substr(trim($value), 0, $max);
    }

    // KHR has no decimals. USD has at most 2, and trailing zeros are dropped (5.00 -> "5", 0.50 -> "0.5").
    private function formatAmount(float $amount, string $currency): string
    {
        if ($currency === 'KHR') {
            if (abs($amount - round($amount)) > 0.00001) {
                throw new InvalidArgumentException('KHR amounts must be whole riel.');
            }

            return (string) (int) round($amount);
        }

        return rtrim(rtrim(number_format($amount, 2, '.', ''), '0'), '.');
    }

    // CRC-16/CCITT-FALSE: polynomial 0x1021, start value 0xFFFF
    public function crc16(string $data): string
    {
        $crc = 0xFFFF;

        for ($i = 0, $n = strlen($data); $i < $n; $i++) {
            $crc ^= ord($data[$i]) << 8;

            for ($bit = 0; $bit < 8; $bit++) {
                $crc = ($crc & 0x8000) ? (($crc << 1) ^ 0x1021) : ($crc << 1);
                $crc &= 0xFFFF;
            }
        }

        return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
    }
}
