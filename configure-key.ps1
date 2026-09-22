$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot '.env.local'
$secure = Read-Host 'Enter your Vercel AI Gateway API key (input is hidden)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    if ([string]::IsNullOrWhiteSpace($key) -or $key.Contains("`n") -or $key.Contains("`r")) {
        throw 'Invalid key input.'
    }
    $existing = @()
    if (Test-Path -LiteralPath $envFile) {
        $existing = @(Get-Content -LiteralPath $envFile | Where-Object { $_ -notmatch '^\s*AI_GATEWAY_API_KEY\s*=' })
    }
    $lines = @($existing) + "AI_GATEWAY_API_KEY=$key"
    Set-Content -LiteralPath $envFile -Value $lines -Encoding ascii
    Write-Output 'AI_GATEWAY_API_KEY saved to .env.local (value not displayed).'
}
finally {
    if ($ptr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    $key = $null
    $secure.Dispose()
}
