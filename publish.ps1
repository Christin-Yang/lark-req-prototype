$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  lark-req-prototype GitHub 发布脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ghAvailable = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghAvailable) {
    Write-Host "[ERROR] gh CLI not found. Please install: https://cli.github.com/" -ForegroundColor Red
    exit 1
}

Write-Host "[1/3] Checking GitHub authentication..." -ForegroundColor Yellow
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Not logged in. Starting GitHub login..." -ForegroundColor Yellow
    Write-Host "Please follow the browser prompts to authorize." -ForegroundColor Yellow
    Write-Host ""
    gh auth login --hostname github.com --git-protocol https --web
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Browser login failed (network issue?). Trying token login..." -ForegroundColor Yellow
        Write-Host "Please paste your GitHub Personal Access Token (needs repo scope):" -ForegroundColor Yellow
        $token = Read-Host -Prompt "Token" -AsSecureString
        $plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($token))
        echo $plainToken | gh auth login --hostname github.com --git-protocol https --with-token
    }
}

Write-Host ""
Write-Host "[2/3] Creating GitHub repository..." -ForegroundColor Yellow
gh repo create lark-req-prototype --public --source=. --push --description "Read Feishu requirement docs, generate HTML prototypes and SRS documents with embedded screenshots"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[3/3] Repository created and code pushed!" -ForegroundColor Green

    $repoUrl = gh repo view --json url -q ".url" 2>$null
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Published Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Repository: $repoUrl" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[2/3] Failed to create repository." -ForegroundColor Red
    Write-Host "If the repo already exists, try pushing manually:" -ForegroundColor Yellow
    Write-Host "  git remote add origin https://github.com/<username>/lark-req-prototype.git" -ForegroundColor Yellow
    Write-Host "  git push -u origin master" -ForegroundColor Yellow
}
