<?php

namespace App\Services\Bakong;

use RuntimeException;
use Throwable;

class BakongException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?int $errorCode = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
