# PowerShell script to run Prisma commands with environment variable
$env:POSTGRES_URL="postgres://be161ddc55b93736b3cfc4287ceb21dd62dcbb39dc6abb5c07bff54dac2916e0:sk_LCUT6SFxAl6uv3JQMOChy@db.prisma.io:5432/postgres?sslmode=require"

# Functions for common Prisma commands
function prisma-status {
    npx prisma migrate status
}

function prisma-push {
    npx prisma db push
}

function prisma-studio {
    npx prisma studio
}

function prisma-generate {
    npx prisma generate
}

function prisma-deploy {
    npx prisma migrate deploy
}

# Export functions
Export-ModuleMember -Function prisma-status, prisma-push, prisma-studio, prisma-generate, prisma-deploy

Write-Host "✅ Prisma helpers loaded! Use: prisma-status, prisma-push, prisma-studio, prisma-generate, prisma-deploy" -ForegroundColor Green