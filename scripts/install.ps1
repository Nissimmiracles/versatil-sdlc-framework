# VERSATIL SDLC Framework - Windows PowerShell Installer
# Provides Windows-specific installation with enhanced support

param(
    [switch]$Global = $false,
    [switch]$Silent = $false,
    [switch]$SkipWizard = $false,
    [switch]$Help = $false
)

$ErrorActionPreference = "Stop"

# Colors
$ColorSuccess = "Green"
$ColorError = "Red"
$ColorWarning = "Yellow"
$ColorInfo = "Cyan"

function Write-Header {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor $ColorInfo
    Write-Host "║   🚀 VERSATIL SDLC Framework - Windows Installer   🚀  ║" -ForegroundColor $ColorInfo
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor $ColorInfo
    Write-Host ""
}

function Show-Help {
    Write-Host "VERSATIL SDLC Framework - Windows Installer"
    Write-Host ""
    Write-Host "Usage: .\install.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Global       Install globally (requires admin)"
    Write-Host "  -Silent       Silent installation (no prompts)"
    Write-Host "  -SkipWizard   Skip configuration wizard"
    Write-Host "  -Help         Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\install.ps1"
    Write-Host "  .\install.ps1 -Global"
    Write-Host "  .\install.ps1 -Silent -SkipWizard"
    Write-Host ""
    exit 0
}

function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-NodeInstalled {
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js detected: $nodeVersion" -ForegroundColor $ColorSuccess
        return $true
    } catch {
        Write-Host "❌ Node.js not found" -ForegroundColor $ColorError
        return $false
    }
}

function Test-NpmInstalled {
    try {
        $npmVersion = npm --version
        Write-Host "✅ npm detected: v$npmVersion" -ForegroundColor $ColorSuccess
        return $true
    } catch {
        Write-Host "❌ npm not found" -ForegroundColor $ColorError
        return $false
    }
}

function Test-GitInstalled {
    try {
        $gitVersion = git --version
        Write-Host "✅ Git detected: $gitVersion" -ForegroundColor $ColorSuccess
        return $true
    } catch {
        Write-Host "⚠️  Git not found (optional)" -ForegroundColor $ColorWarning
        return $false
    }
}

function Install-Framework {
    param(
        [bool]$IsGlobal
    )

    Write-Host "📦 Installing VERSATIL SDLC Framework..." -ForegroundColor $ColorInfo
    Write-Host ""

    try {
        if ($IsGlobal) {
            Write-Host "Installing globally (requires admin privileges)..." -ForegroundColor $ColorInfo
            npm install -g versatil-sdlc-framework
        } else {
            Write-Host "Installing locally..." -ForegroundColor $ColorInfo
            npm install versatil-sdlc-framework
        }

        Write-Host ""
        Write-Host "✅ Framework installed successfully!" -ForegroundColor $ColorSuccess
        return $true
    } catch {
        Write-Host ""
        Write-Host "❌ Installation failed: $_" -ForegroundColor $ColorError
        return $false
    }
}

function Initialize-FrameworkDirectory {
    $versatilHome = Join-Path $env:USERPROFILE ".versatil"

    if (-not (Test-Path $versatilHome)) {
        Write-Host "📁 Creating framework directory..." -ForegroundColor $ColorInfo
        New-Item -ItemType Directory -Path $versatilHome -Force | Out-Null
        Write-Host "   Location: $versatilHome" -ForegroundColor $ColorInfo
        Write-Host ""
    }

    return $versatilHome
}

function Test-FrameworkInstalled {
    try {
        $version = versatil --version 2>$null
        return $true
    } catch {
        return $false
    }
}

function Show-PostInstall {
    param(
        [string]$VersatilHome
    )

    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor $ColorInfo
    Write-Host ""
    Write-Host "🎉 Installation Complete!" -ForegroundColor $ColorSuccess
    Write-Host ""
    Write-Host "📚 Quick Start:" -ForegroundColor $ColorInfo
    Write-Host ""
    Write-Host "  1. Verify installation:"
    Write-Host "     versatil doctor"
    Write-Host ""
    Write-Host "  2. Configure preferences:"
    Write-Host "     versatil config wizard"
    Write-Host ""
    Write-Host "  3. Get help:"
    Write-Host "     versatil --help"
    Write-Host ""
    Write-Host "  4. Initialize in your project:"
    Write-Host "     cd your-project"
    Write-Host "     versatil init"
    Write-Host ""
    Write-Host "🤖 BMAD Agents:" -ForegroundColor $ColorInfo
    Write-Host "  • Maria-QA      - Quality assurance"
    Write-Host "  • James-Frontend - UI/UX development"
    Write-Host "  • Marcus-Backend - API development"
    Write-Host "  • Alex-BA        - Business analysis"
    Write-Host "  • Sarah-PM       - Project coordination"
    Write-Host "  • Dr.AI-ML       - AI/ML development"
    Write-Host ""
    Write-Host "📖 Documentation:" -ForegroundColor $ColorInfo
    Write-Host "  • GitHub: https://github.com/MiraclesGIT/versatil-sdlc-framework"
    Write-Host "  • Framework Home: $VersatilHome"
    Write-Host ""
    Write-Host "💡 Windows Tips:" -ForegroundColor $ColorInfo
    Write-Host "  • Use PowerShell or CMD for best experience"
    Write-Host "  • Add to PATH if versatil command not found"
    Write-Host "  • Run as Administrator for global install"
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor $ColorInfo
    Write-Host ""
    Write-Host "Happy coding! 🚀" -ForegroundColor $ColorSuccess
    Write-Host ""
}

function Add-ToPath {
    param(
        [string]$Path
    )

    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

    if ($currentPath -notlike "*$Path*") {
        Write-Host "Adding to PATH..." -ForegroundColor $ColorInfo
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$Path", "User")
        Write-Host "✅ Added to PATH" -ForegroundColor $ColorSuccess
        Write-Host "   Please restart your terminal for changes to take effect" -ForegroundColor $ColorWarning
    }
}

# Main installation flow
function Main {
    if ($Help) {
        Show-Help
    }

    if (-not $Silent) {
        Write-Header
    }

    # Check prerequisites
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor $ColorInfo
    Write-Host ""

    if (-not (Test-NodeInstalled)) {
        Write-Host ""
        Write-Host "❌ Node.js is required but not installed." -ForegroundColor $ColorError
        Write-Host "   Please install from: https://nodejs.org/" -ForegroundColor $ColorError
        Write-Host ""
        exit 1
    }

    if (-not (Test-NpmInstalled)) {
        Write-Host ""
        Write-Host "❌ npm is required but not installed." -ForegroundColor $ColorError
        Write-Host "   npm should come with Node.js. Please reinstall Node.js." -ForegroundColor $ColorError
        Write-Host ""
        exit 1
    }

    Test-GitInstalled | Out-Null

    Write-Host ""

    # Check if global install requested
    if ($Global) {
        if (-not (Test-Administrator)) {
            Write-Host "⚠️  Global installation requires Administrator privileges." -ForegroundColor $ColorWarning
            Write-Host "   Please run PowerShell as Administrator and try again." -ForegroundColor $ColorWarning
            Write-Host ""
            exit 1
        }
    }

    # Initialize framework directory
    $versatilHome = Initialize-FrameworkDirectory

    # Install framework
    $success = Install-Framework -IsGlobal $Global

    if (-not $success) {
        Write-Host ""
        Write-Host "Installation failed. Please check the error message above." -ForegroundColor $ColorError
        Write-Host ""
        exit 1
    }

    # Verify installation
    Write-Host "🔍 Verifying installation..." -ForegroundColor $ColorInfo
    Start-Sleep -Seconds 2

    if (Test-FrameworkInstalled) {
        Write-Host "✅ Installation verified" -ForegroundColor $ColorSuccess
    } else {
        Write-Host "⚠️  Command 'versatil' not found in PATH" -ForegroundColor $ColorWarning
        Write-Host "   You may need to restart your terminal or add npm global bin to PATH" -ForegroundColor $ColorWarning

        # Try to add to PATH
        try {
            $npmPrefix = npm prefix -g
            $npmBin = Join-Path $npmPrefix "bin"
            if (Test-Path $npmBin) {
                Add-ToPath -Path $npmBin
            }
        } catch {
            # Ignore errors
        }
    }

    # Run configuration wizard (unless skipped)
    if (-not $SkipWizard -and -not $Silent) {
        Write-Host ""
        Write-Host "Would you like to configure your preferences now? (Y/n): " -NoNewline -ForegroundColor $ColorInfo
        $response = Read-Host

        if ($response -eq "" -or $response -eq "Y" -or $response -eq "y") {
            Write-Host ""
            Write-Host "🎯 Starting configuration wizard..." -ForegroundColor $ColorInfo
            Write-Host ""
            try {
                versatil config wizard
            } catch {
                Write-Host "⚠️  Wizard not available yet" -ForegroundColor $ColorWarning
                Write-Host "   Run: versatil config wizard when ready" -ForegroundColor $ColorWarning
            }
        }
    }

    # Show post-install information
    if (-not $Silent) {
        Show-PostInstall -VersatilHome $versatilHome
    }

    exit 0
}

# Run main function
Main
