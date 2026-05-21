param(
    [string]$Message = "Prepare for Railway deploy"
)

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git não encontrado. Instale o Git e tente novamente."
    exit 1
}

git add .
try {
    git commit -m $Message
} catch {
    Write-Host "Nenhuma mudança a commitar ou commit falhou."
}

git push
