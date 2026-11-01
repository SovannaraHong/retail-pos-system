<?php

namespace App\Services\Bakong;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

//1
// BakongClient – Communicates with the Bakong API to check payment status
// using MD5 and automatically renews expired authentication tokens.
class BakongClient
{

    public function checkTransactionByMd5(string $md5): array
    {

        $json = $this->post('/v1/check_transaction_by_md5', ['md5' => $md5]);

        if (($json['responseCode'] ?? null) === 0 && !empty($json['data'])) {
            return ['state' => 'paid', 'data' => $json['data']];
        }

        $errorCode = $json['errorCode'] ?? null;
        if ($errorCode === 1) {
            return ['state' => 'not_found'];      // nobody has paid this QR (yet)
        }

        if ($errorCode === 3) {
            return ['state' => 'failed', 'message' => (string) ($json['responseMessage'] ?? 'Transaction failed.')];
        }

        throw new BakongException(
            'Bakong replied: ' . ($json['responseMessage'] ?? 'unexpected response'),
            is_int($errorCode) ? $errorCode : null,
        );
    }


    private function post(string $path, array $body, $mayRenew = true): array
    {
        $token = $this->token();
        if (!$token) {
            throw new BakongException('BAKONG_TOKEN is not set.');
        }

        try {
            $response = Http::baseUrl($this->baseUrl())
                ->withToken($token)
                ->acceptJson()
                ->asJson()
                ->timeout((int)config('bakong.timeout', 15))
                ->post($path, $body);
        } catch (ConnectionException $e) {
            throw new BakongException(
                'Cannot reach the Bakong API. It only accepts connections from Cambodian IP addresses, so check where this server runs.',
                null,
                $e,
            );
        }

        $json = $response->json() ?? [];

        //expire or invalid token
        if ($response->status() === 401 || ($json['errorCode'] ?? null) === 6) {

            if ($mayRenew && $this->renewToken()) {
                return $this->post($path, $body, false);
            }

            throw new BakongException('The Bakong token is invalid or expired. Renew it and update
            BAKONG_TOKEN (or set BAKONG_EMAIL for automatic renewal).', 6);
        }

        if ($response->status() === 403) {
            throw new BakongException('Bakong refused the request (403). The API only accepts Cambodian IP addresses.');
        }

        if ($response->serverError()) {
            throw new BakongException('Bakong is having problems right now (HTTP ' . $response->status() . '). Try again shortly.');
        }

        return $json;
    }


    // asks Bakong for a fresh token and remembers it
    private function renewToken(): bool
    {
        $email =  config('bakong.email');
        if (!$email) {
            return false;
        }

        try {
            $response = Http::baseUrl($this->baseUrl())
                ->acceptJson()
                ->asJson()
                ->timeout((int)config('bakong.timeout', 15))
                ->post('/v1/renew_token', ['email' => $email]);
        } catch (ConnectionException) {
            return false;
        }

        $token = data_get($response->json(), 'data.token');
        if (!$token) {
            return false;
        }
        Cache::forever($this->cacheKey(), $token);
        return true;
    }
    private function token(): ?string
    {
        return Cache::get($this->cacheKey()) ?: config('bakong.token');
    }
    private function cacheKey(): string
    {
        return 'bakong.token' . substr(sha1((string)config('bakong.base_url')), 0, 12);
    }


    private function baseUrl(): string
    {

        return rtrim((string)config('bakong.base_url'), '/');
    }
}
