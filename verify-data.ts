import db from './lib/db'

async function main() {
    const count = await db.item.count()
    const items = await db.item.findMany({
        include: { category: true, location: true }
    })

    console.log(`Deepmind Verification: Found ${count} items.`)
    console.log(JSON.stringify(items, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await db.$disconnect()
    })
