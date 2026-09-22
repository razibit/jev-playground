$envFile = Join-Path $PSScriptRoot '.env.local'
if (-not (Test-Path -LiteralPath $envFile) -or -not (Select-String -LiteralPath $envFile -Pattern '^\s*AI_GATEWAY_API_KEY\s*=\s*\S+' -Quiet)) {
    & (Join-Path $PSScriptRoot 'configure-key.ps1')
    if (-not (Test-Path -LiteralPath $envFile) -or -not (Select-String -LiteralPath $envFile -Pattern '^\s*AI_GATEWAY_API_KEY\s*=\s*\S+' -Quiet)) {
        Write-Error 'No key was saved. Run this command again and enter your Vercel key at the hidden prompt.'
        exit 1
    }
}
Push-Location $PSScriptRoot
try {
    & npm run jev:example
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
