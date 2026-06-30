import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const CATEGORIES = [
  "Fiction",
  "Science Fiction",
  "Fantasy",
  "Non-Fiction",
  "Biography",
  "History",
  "Technology",
  "Self-Help",
];

const BOOKS = [
  { title: "The Pragmatic Programmer", author: "Andrew Hunt & David Thomas", category: "Technology", publishedAt: 1999, copies: 4, isbn: "9780201616224", description: "Your journey to mastery, 20th anniversary edition." },
  { title: "Clean Code", author: "Robert C. Martin", category: "Technology", publishedAt: 2008, copies: 3, isbn: "9780132350884", description: "A handbook of agile software craftsmanship." },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", category: "Technology", publishedAt: 2017, copies: 5, isbn: "9781449373320", description: "The big ideas behind reliable, scalable, maintainable systems." },
  { title: "Dune", author: "Frank Herbert", category: "Science Fiction", publishedAt: 1965, copies: 6, isbn: "9780441013593", description: "A stunning blend of adventure and mysticism on the desert planet Arrakis." },
  { title: "Neuromancer", author: "William Gibson", category: "Science Fiction", publishedAt: 1984, copies: 2, isbn: "9780441569595", description: "The novel that defined the cyberpunk genre." },
  { title: "The Hobbit", author: "J.R.R. Tolkien", category: "Fantasy", publishedAt: 1937, copies: 5, isbn: "9780547928227", description: "A great modern classic and the prelude to The Lord of the Rings." },
  { title: "A Game of Thrones", author: "George R.R. Martin", category: "Fantasy", publishedAt: 1996, copies: 4, isbn: "9780553103540", description: "Book one of A Song of Ice and Fire." },
  { title: "1984", author: "George Orwell", category: "Fiction", publishedAt: 1949, copies: 7, isbn: "9780451524935", description: "A dystopian social science fiction novel and cautionary tale." },
  { title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction", publishedAt: 1960, copies: 3, isbn: "9780061120084", description: "A novel of warmth and humor despite dealing with serious issues." },
  { title: "Sapiens", author: "Yuval Noah Harari", category: "History", publishedAt: 2011, copies: 4, isbn: "9780062316097", description: "A brief history of humankind." },
  { title: "Atomic Habits", author: "James Clear", category: "Self-Help", publishedAt: 2018, copies: 6, isbn: "9780735211292", description: "An easy & proven way to build good habits & break bad ones." },
  { title: "Steve Jobs", author: "Walter Isaacson", category: "Biography", publishedAt: 2011, copies: 2, isbn: "9781451648539", description: "The exclusive biography of Apple's co-founder." },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", category: "Non-Fiction", publishedAt: 2011, copies: 3, isbn: "9780374533557", description: "A tour of the mind explaining the two systems that drive the way we think." },
  { title: "The Lean Startup", author: "Eric Ries", category: "Non-Fiction", publishedAt: 2011, copies: 3, isbn: "9780307887894", description: "How constant innovation creates radically successful businesses." },
  { title: "Brave New World", author: "Aldous Huxley", category: "Science Fiction", publishedAt: 1932, copies: 4, isbn: "9780060850524", description: "A dystopian novel set in a futuristic World State." },
  { title: "The Name of the Wind", author: "Patrick Rothfuss", category: "Fantasy", publishedAt: 2007, copies: 3, isbn: "9780756404741", description: "The riveting first-person narrative of Kvothe." },
];

async function main() {
  console.log("Seeding database...");

  // Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@library.dev" },
    update: {},
    create: { name: "Library Admin", email: "admin@library.dev", password: adminPassword, role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "reader@library.dev" },
    update: {},
    create: { name: "Jane Reader", email: "reader@library.dev", password: userPassword, role: "USER" },
  });

  // Categories
  const categoryMap = new Map<string, string>();
  for (const name of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    categoryMap.set(name, cat.id);
  }

  // Books
  for (const b of BOOKS) {
    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        description: b.description,
        publishedAt: b.publishedAt,
        totalCopies: b.copies,
        available: b.copies,
        categoryId: categoryMap.get(b.category) ?? null,
      },
    });
  }

  console.log(`Seeded ${CATEGORIES.length} categories and ${BOOKS.length} books.`);
  console.log("Admin login:  admin@library.dev / admin123");
  console.log("User login:   reader@library.dev / user1234");
  console.log(`Admin id: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
