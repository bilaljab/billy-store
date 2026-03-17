const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin
  const hashedPassword = await bcrypt.hash('Bilal2026*', 10);
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hashedPassword },
  });

  // Seed sample products
  const products = [
    {
      name: 'God of War Ragnarök',
      description: 'استمر في رحلة كريتوس وأتريوس في عالم الأساطير الإسكندنافية. تجربة لا تُنسى مليئة بالحروب والأحجيات والقصص المؤثرة.',
      price: 89,
      category: 'game',
      featured: true,
      image: null,
    },
    {
      name: 'Spider-Man 2',
      description: 'العب بشخصية بيتر باركر وميلز موراليس في مغامرة خارقة مذهلة عبر مدينة نيويورك. أكشن وقصة استثنائية.',
      price: 99,
      category: 'game',
      featured: true,
      image: null,
    },
    {
      name: 'FIFA 25',
      description: 'أحدث إصدار من سلسلة FIFA. تجربة كرة قدم واقعية مع أندية وبطولات حصرية بجرافيكس خيالي.',
      price: 79,
      category: 'game',
      featured: true,
      image: null,
    },
    {
      name: 'PS Plus Essential - شهر',
      description: 'اشتراك بلايستيشن بلس أساسي لمدة شهر كامل. العب أونلاين واحصل على ألعاب مجانية شهرياً.',
      price: 25,
      category: 'subscription',
      featured: true,
      image: null,
    },
    {
      name: 'PS Plus Extra - 3 أشهر',
      description: 'اشتراك بلايستيشن بلس إكسترا لمدة 3 أشهر. وصول لمكتبة ضخمة من الألعاب بالإضافة لمزايا إسينشال.',
      price: 85,
      category: 'subscription',
      featured: true,
      image: null,
    },
    {
      name: 'PS Plus Premium - سنة',
      description: 'الاشتراك الذهبي الكامل لمدة سنة. كل مزايا إكسترا + كلاسيكيات PS1 وPS2 وPS3 وبث الألعاب.',
      price: 220,
      category: 'subscription',
      featured: false,
      image: null,
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log('✅ Database seeded successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
