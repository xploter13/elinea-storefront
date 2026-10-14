import type { StorefrontPayload } from '#shared/types/storefront'
import { productsInCategory } from '~/utils/category-products'

export type BlogTopic = 'guide' | 'technology' | 'home' | 'wellbeing'

export interface BlogSection {
  id: string
  title: string
  paragraphs: string[]
  points?: string[]
}

export interface BlogArticle {
  slug: string
  topic: BlogTopic
  category: string
  title: string
  excerpt: string
  image: string
  imageAlt: string
  readingMinutes: number
  introduction: string
  sections: BlogSection[]
  quote: string
}

// Conteúdo editorial local de demonstração; não representa publicações da API.
export const blogArticles: BlogArticle[] = [
  {
    slug: 'escolher-melhor-comeca-antes-do-carrinho',
    topic: 'guide',
    category: 'Guia de compras',
    title: 'Escolher melhor começa antes do carrinho',
    excerpt: 'Uma forma mais simples de encontrar o que combina com a sua rotina, sem pressa e sem excesso.',
    image: '/images/blog/thoughtful-shopping.png',
    imageAlt: 'Caderno aberto e objetos cotidianos sobre uma mesa azul clara',
    readingMinutes: 3,
    introduction: 'Encontrar algo novo pode ser prazeroso. O segredo está em olhar para a própria rotina antes de olhar para uma vitrine: assim, cada escolha ganha um motivo para existir.',
    sections: [
      {
        id: 'comece-pelo-uso',
        title: 'Comece pelo uso, não pela novidade',
        paragraphs: [
          'Pense no momento em que o produto fará parte do seu dia. Onde ele vai ficar? Com que frequência será usado? Qual dificuldade ele deve resolver? Essas perguntas tornam a busca mais clara e ajudam a separar uma boa ideia de um desejo passageiro.',
          'Se você já tem algo semelhante, observe o que funciona e o que falta. Essa pequena comparação costuma revelar quais características realmente importam para você.',
        ],
      },
      {
        id: 'compare-o-essencial',
        title: 'Compare o que importa',
        paragraphs: [
          'Fotos, medidas, materiais e descrições contam partes diferentes da mesma história. Reserve um momento para conferir os detalhes que afetam o uso: tamanho, compatibilidade, manutenção e condições de entrega.',
          'Nem sempre a opção com mais recursos é a melhor. Uma escolha prática é aquela cujas qualidades você consegue aproveitar de verdade.',
        ],
        points: ['Defina até três critérios importantes.', 'Confira medidas e especificações.', 'Revise a escolha antes de concluir.'],
      },
      {
        id: 'de-tempo-a-escolha',
        title: 'Dê tempo à sua escolha',
        paragraphs: [
          'Quando não há urgência, deixar uma seleção em aberto por algumas horas pode trazer perspectiva. Se o produto continuar fazendo sentido depois, a decisão tende a ser mais tranquila.',
          'Comprar com intenção não significa perder a espontaneidade. Significa abrir espaço para descobrir o que vale a pena levar para a sua vida.',
        ],
      },
    ],
    quote: 'A melhor descoberta é aquela que continua fazendo sentido depois que a novidade passa.',
  },
  {
    slug: 'tecnologia-que-acompanha-o-seu-dia',
    topic: 'technology',
    category: 'Tecnologia',
    title: 'Tecnologia que acompanha o seu dia',
    excerpt: 'O que observar para escolher dispositivos que se encaixam na sua forma de trabalhar, estudar e descansar.',
    image: '/images/blog/everyday-tech.png',
    imageAlt: 'Notebook, fones de ouvido e celular sobre uma mesa de pedra',
    readingMinutes: 3,
    introduction: 'Um bom dispositivo não precisa chamar atenção o tempo todo. Ele deve ajudar nas tarefas que você já faz e tornar mais fáceis os momentos que merecem o seu foco.',
    sections: [
      {
        id: 'entenda-seu-ritmo',
        title: 'Entenda o seu ritmo',
        paragraphs: [
          'Antes de comparar modelos, liste as atividades mais frequentes. Para quem se desloca muito, peso e autonomia podem falar mais alto. Para quem passa horas na mesma mesa, conforto e organização talvez sejam o ponto de partida.',
          'Pensar em situações concretas evita comprar recursos que parecem interessantes no anúncio, mas quase nunca entram em uso.',
        ],
      },
      {
        id: 'conforto-tambem-e-recurso',
        title: 'Conforto também é recurso',
        paragraphs: [
          'Um fone pode ter boas especificações e ainda assim não ser confortável por muito tempo. Um teclado pode ser rápido, mas ocupar mais espaço do que a sua mesa permite. Medidas, formato e ergonomia importam tanto quanto números.',
          'Sempre que possível, compare dimensões e modos de uso com os objetos que você já conhece. Isso aproxima a escolha da sua realidade.',
        ],
        points: ['Confira conexões e compatibilidade.', 'Observe peso e dimensões.', 'Avalie o uso por períodos longos.'],
      },
      {
        id: 'pense-no-conjunto',
        title: 'Pense no conjunto',
        paragraphs: [
          'Dispositivos funcionam melhor quando conversam entre si. Verifique quais acessórios você já usa, quais entradas estão disponíveis e se a configuração cabe no espaço que você tem.',
          'No fim, a melhor tecnologia é a que acompanha o seu dia com naturalidade, sem pedir que você reorganize a vida inteira ao redor dela.',
        ],
      },
    ],
    quote: 'Escolha a tecnologia a partir da rotina que você tem, não da rotina que um anúncio imagina.',
  },
  {
    slug: 'uma-casa-que-funciona-para-voce',
    topic: 'home',
    category: 'Casa & decoração',
    title: 'Uma casa que funciona para você',
    excerpt: 'Texturas, luz e pequenos ajustes podem mudar a forma como você vive cada ambiente.',
    image: '/images/blog/living-space.png',
    imageAlt: 'Poltrona clara com manta azul em uma sala iluminada pelo sol',
    readingMinutes: 3,
    introduction: 'Renovar um ambiente não exige começar do zero. Às vezes, basta observar como o espaço é usado e escolher um detalhe capaz de tornar a rotina mais confortável.',
    sections: [
      {
        id: 'observe-o-ambiente',
        title: 'Observe antes de mudar',
        paragraphs: [
          'A sala recebe pessoas ou serve como lugar de descanso? O quarto precisa de mais organização ou de uma luz mais suave? Cada ambiente tem uma função, e entender essa função ajuda a decidir por onde começar.',
          'Repare também nos caminhos de circulação. Um móvel bonito só faz sentido se ele deixar espaço para a vida acontecer.',
        ],
      },
      {
        id: 'trabalhe-em-camadas',
        title: 'Trabalhe em camadas',
        paragraphs: [
          'Luz, textura e cor podem ser ajustadas aos poucos. Uma luminária muda o clima à noite; uma manta acrescenta conforto; uma peça de apoio aproxima o que você usa todos os dias.',
          'Escolha primeiro o elemento que mais melhora o uso do espaço. Os detalhes seguintes ficam mais fáceis de combinar quando existe um ponto de partida.',
        ],
        points: ['Priorize a função do ambiente.', 'Misture superfícies lisas e texturas macias.', 'Observe a luz em horários diferentes.'],
      },
      {
        id: 'deixe-espaco',
        title: 'Deixe espaço para a vida',
        paragraphs: [
          'Uma casa acolhedora não precisa parecer pronta para uma fotografia. Livros em uso, objetos com história e cantos que mudam de função também fazem parte dela.',
          'Procure peças que convivam bem com o que você já tem. O resultado mais interessante costuma surgir dessa mistura pessoal.',
        ],
      },
    ],
    quote: 'Uma boa casa não é a mais cheia de novidades; é a que abre espaço para viver melhor.',
  },
  {
    slug: 'o-valor-dos-pequenos-rituais',
    topic: 'wellbeing',
    category: 'Bem-estar',
    title: 'O valor dos pequenos rituais',
    excerpt: 'Como encontrar tempo para o cuidado sem transformar a rotina em uma lista de exigências.',
    image: '/images/blog/self-care.png',
    imageAlt: 'Frascos de cuidado pessoal e toalha branca em uma prateleira clara',
    readingMinutes: 3,
    introduction: 'Um momento de cuidado pode caber em poucos minutos. O que importa é que ele faça sentido para você e encontre um lugar possível no seu dia.',
    sections: [
      {
        id: 'comece-pequeno',
        title: 'Comece pequeno',
        paragraphs: [
          'Não é preciso criar uma rotina extensa para sentir que existe uma pausa. Separar alguns minutos para organizar o espaço, tomar um banho com calma ou cuidar da pele já pode marcar uma mudança de ritmo.',
          'Escolha um gesto simples e repita quando for conveniente. A constância costuma nascer da facilidade, não da cobrança.',
        ],
      },
      {
        id: 'escolha-o-essencial',
        title: 'Escolha o essencial',
        paragraphs: [
          'Muitos produtos podem parecer indispensáveis quando aparecem juntos. Na prática, vale observar o que você usa, gosta e consegue manter. Ter poucos itens bem escolhidos torna o cuidado mais leve.',
          'Leia as informações de uso de cada produto e respeite as necessidades do seu corpo. Quando houver dúvidas específicas de saúde, procure orientação profissional.',
        ],
        points: ['Prefira uma rotina que caiba no seu tempo.', 'Observe como cada produto é usado.', 'Ajuste o ritual quando a sua vida mudar.'],
      },
      {
        id: 'um-momento-seu',
        title: 'Faça desse momento algo seu',
        paragraphs: [
          'O cuidado não precisa seguir uma estética ou um horário ideal. Pode acontecer de manhã, à noite ou entre duas tarefas, com os objetos e os gestos que você prefere.',
          'A melhor rotina é aquela que acolhe o dia real. Pequenos rituais ganham valor justamente porque podem ser seus.',
        ],
      },
    ],
    quote: 'Cuidar de si pode começar com um gesto pequeno, repetido no seu próprio tempo.',
  },
]

const topicPatterns: Partial<Record<BlogTopic, RegExp>> = {
  technology: /eletr|tech|inform|comput|smart|gadget|notebook|celular/i,
  home: /casa|decor|m[oó]ve|lar|ilumina|organiza/i,
  wellbeing: /beleza|cosm[eé]t|skincare|autocuidado|bem-estar|higiene|cuidado pessoal/i,
}

export function blogArticlesForStore(storefront: StorefrontPayload): BlogArticle[] {
  const activeCategories = storefront.categories.filter(category => category.is_active)
  const populatedNames = activeCategories
    .filter(category => productsInCategory(category.id, activeCategories, storefront.products).length > 0)
    .map(category => `${category.name} ${category.slug}`)

  return blogArticles.filter(article => {
    const pattern = topicPatterns[article.topic]
    return !pattern || populatedNames.some(name => pattern.test(name))
  })
}
