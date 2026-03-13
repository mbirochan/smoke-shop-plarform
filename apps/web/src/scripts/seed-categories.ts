/* eslint-disable no-console */
import { db } from "../lib/db";
import { categories } from "../db";
import { generateSlug } from "../lib/slug";

interface CategoryDef {
  name: string;
  children?: CategoryDef[];
}

const CATEGORY_TREE: CategoryDef[] = [
  {
    name: "Cigarettes",
    children: [{ name: "Regular" }, { name: "Menthol" }, { name: "Clove/Kretek" }],
  },
  {
    name: "Cigars",
    children: [{ name: "Premium" }, { name: "Machine-Made" }, { name: "Cigarillos" }],
  },
  {
    name: "Vape",
    children: [
      { name: "Disposable" },
      { name: "Pod Systems" },
      { name: "E-Liquid" },
      { name: "Mods & Tanks" },
    ],
  },
  {
    name: "Smokeless Tobacco",
    children: [{ name: "Chewing Tobacco" }, { name: "Snuff/Dip" }, { name: "Snus" }],
  },
  {
    name: "Accessories",
    children: [
      { name: "Lighters" },
      { name: "Rolling Papers" },
      { name: "Pipes" },
      { name: "Grinders" },
      { name: "Cases & Holders" },
    ],
  },
  {
    name: "Hookah",
    children: [
      { name: "Shisha/Tobacco" },
      { name: "Pipes & Parts" },
      { name: "Charcoal" },
    ],
  },
];

async function seedCategories() {
  console.log("Seeding categories...");

  for (let i = 0; i < CATEGORY_TREE.length; i++) {
    const cat = CATEGORY_TREE[i]!;
    const slug = generateSlug(cat.name);

    // Upsert parent
    const [parent] = await db
      .insert(categories)
      .values({
        name: cat.name,
        slug,
        sortOrder: i,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: cat.name, sortOrder: i },
      })
      .returning();

    if (cat.children && parent) {
      for (let j = 0; j < cat.children.length; j++) {
        const child = cat.children[j]!;
        const childSlug = generateSlug(`${cat.name} ${child.name}`);

        await db
          .insert(categories)
          .values({
            name: child.name,
            slug: childSlug,
            parentId: parent.id,
            sortOrder: j,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: categories.slug,
            set: { name: child.name, parentId: parent.id, sortOrder: j },
          });
      }
    }
  }

  console.log("Categories seeded successfully.");
}

seedCategories()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
