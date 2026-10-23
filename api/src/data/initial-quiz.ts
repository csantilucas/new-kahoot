export interface InitialAlternative {
  letter: string;
  text: string;
  isCorrect: boolean;
  color: string;
}

export interface InitialQuestion {
  order: number;
  statement: string;
  imageUrl?: string | null;
  points: number;
  explanation: string;
  alternatives: InitialAlternative[];
}

export interface InitialQuizData {
  title: string;
  description: string;
  category: string;
  secondsPerQuestion: number;
  warningSeconds: number;
  bgMusic: string;
  soundEffects: boolean;
  autoReveal: boolean;
  showExplanation: boolean;
  customMusicUrl?: string;
  correctSoundUrl?: string;
  timeUpSoundUrl?: string;
  countdownSoundUrl?: string;
  confettiSoundUrl?: string;
  questions: InitialQuestion[];
}

export const AULAO_ENEM_QUIZ: InitialQuizData = {
  title: 'Aulão ENEM Oficial - Todas as Áreas',
  description: 'Revisão intensiva para o ENEM: Matemática, Biologia, Inglês, Filosofia, Química, Sociologia, Português, História e Literatura.',
  category: 'ENEM',
  secondsPerQuestion: 120,
  warningSeconds: 10,
  bgMusic: 'custom',
  soundEffects: true,
  autoReveal: true,
  showExplanation: true,
  customMusicUrl: '/sounds/abertura.mp3',
  correctSoundUrl: '/sounds/certa-resposta.mp3',
  timeUpSoundUrl: '/sounds/tempo-esgotado.mp3',
  countdownSoundUrl: '/sounds/10-segundos.mp3',
  confettiSoundUrl: '/sounds/tempo-esgotado.mp3',
  questions: [
    {
      order: 1,
      statement: `(ENEM 2025 / Matemática)
O gráfico apresenta as quantidades mensais vendidas de um item produzido por uma indústria no primeiro semestre deste ano, em milhar de unidades.

A partir do mês de março, observa-se o crescimento das vendas até o mês de maio e uma queda no mês de junho, que se explica pela falta de matéria-prima que ocorreu na primeira semana daquele mês. Caso essa falta de matéria-prima não tivesse ocorrido, a estimativa feita pela gerência é de que as vendas mensais desse item continuariam a crescer linearmente, mantendo o padrão de crescimento observado no período de março a maio nos demais meses do ano.

A estimativa feita para as vendas desse item no mês de julho, em milhar de unidades, antes da queda registrada no mês de junho, foi de:`,
      imageUrl: '/questoes/image1.png',
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa E. Mantendo o padrão de crescimento linear observado entre março e maio, a estimativa calculada pela gerência para o mês de julho totaliza 900 mil unidades.',
      alternatives: [
        { letter: 'A', text: '500.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: '600.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: '700.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: '800.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: '900.', isCorrect: true, color: 'blue' },
      ],
    },
    {
      order: 2,
      statement: `(ENEM 2025 / Matemática)
Uma livraria comercializa livros dos seguintes gêneros literários: ficção científica, autoajuda, romance e biografia. O gráfico apresenta o estoque dos livros que essa livraria tem, por gênero literário e por nacionalidade do autor, bem como a demanda por gênero literário, obtida por meio de uma enquete feita com seus clientes habituais.

Estoque e demanda por livros:

O gerente da livraria fará a encomenda de novos exemplares somente do gênero cuja quantidade em estoque seja insuficiente para atender a demanda constatada pela enquete. O gênero de livro do qual o gerente deverá encomendar mais exemplares é:`,
      imageUrl: '/questoes/image2.png',
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa C. Comparando a quantidade total em estoque com a demanda registrada pela enquete dos clientes, os livros de autoajuda são os únicos cujo estoque é inferior à demanda exigida.',
      alternatives: [
        { letter: 'A', text: 'ficção, pois é o que apresenta maior demanda.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'biografia, pois é o gênero que tem a menor demanda.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'autoajuda, pois a quantidade em estoque é inferior à demanda.', isCorrect: true, color: 'blue' },
        { letter: 'D', text: 'biografia, pois é o gênero que tem a menor quantidade de livros em estoque.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'romance, pois é o que apresenta o menor estoque de livros de autores brasileiros.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 3,
      statement: `(Biologia / Fisiologia Humana)
Durante uma trilha, realizada na Chapada dos Guimarães, um grupo de turistas perdeu-se de seu guia. Durante toda a manhã e parte da tarde, o grupo que estava perdido permaneceu sem água e debaixo de sol, o que fez com que eles sentissem cada vez mais sede. Em consequência desse fato, o sistema excretor desses indivíduos teve um acréscimo em um dos seus processos funcionais.

Baseado no exposto, analise as proposições a seguir como verdadeiras ou falsas:

(  ) Produziu urina mais concentrada e células do encéfalo estimularam a hipófise a liberar ADH.
(  ) Produziu uma urina diluída e escassa estimulando a hipófise a liberar menos ADH.
(  ) Com a ingestão de menos água, há uma expansão maior nos átrios cardíacos liberando hormônio PNA (peptídeo natriurético atrial).
(  ) A vasopressina sintetizada no hipotálamo controla a reabsorção de água nos filtrados glomerulares. Com a ingestão de pouca água, o resultado é uma maior reabsorção de água pelos túbulos renais.

Está correta a sequência:`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa B (V – F – F – V). Em situação de desidratação severa, a osmolalidade plasmática aumenta, estimulando os osmorreceptores a liberar vasopressina (ADH) pela neuro-hipófise, promovendo reabsorção renal de água e urina hipertônica concentrada.',
      alternatives: [
        { letter: 'A', text: 'V – F – V – F.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'V – F – F – V.', isCorrect: true, color: 'blue' },
        { letter: 'C', text: 'F – F – V – F.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'F – F – V – V.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'V – F – F – F.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 4,
      statement: `(Biologia / Ecologia e Meio Ambiente)
Em propriedades rurais, a criação intensiva de animais e o preparo de alimentos geram grandes quantidades de resíduos orgânicos. Quando esses resíduos são descartados inadequadamente, podem contaminar o solo e os corpos d’água. Uma alternativa sustentável é a utilização de biodigestores, nos quais microrganismos decompõem a matéria orgânica na ausência de oxigênio, produzindo biogás e um material residual que pode ser aproveitado como fertilizante, desde que tratado e manejado corretamente.

A adoção dessa tecnologia, associada à destinação adequada dos resíduos, contribui principalmente para evitar qual problema ambiental?`,
      imageUrl: '/questoes/image3.png',
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa B. O lançamento direto de resíduos orgânicos em corpos hídricos provoca aporte excessivo de nutrientes (nitrogênio e fósforo), desencadeando o processo de eutrofização, proliferação de algas e asfixia da fauna aquática.',
      alternatives: [
        { letter: 'A', text: 'Bioacumulação de toxinas em plantas.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'Eutrofização dos corpos de água.', isCorrect: true, color: 'blue' },
        { letter: 'C', text: 'Destruição da camada de ozônio.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'Ocorrência de inversão térmica.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'Produção de chuva ácida.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 5,
      statement: `(Enem 2024 / Língua Inglesa)
[Observe as citações atribuídas a Albert Einstein e a Bob Marley na imagem de apoio]

A relação entre as citações atribuídas ao físico Albert Einstein e ao cantor e compositor Bob Marley reside na crença de que é necessário:`,
      imageUrl: '/questoes/image4.png',
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa C. Ambas as passagens valorizam a capacidade de encontrar oportunidades e aprender com situações desafiadoras ou adversas.',
      alternatives: [
        { letter: 'A', text: 'dar oportunidade a pessoas que parecem necessitadas.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'identificar contextos que podem representar perigo.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'tirar proveito de situações que podem ser adversas.', isCorrect: true, color: 'blue' },
        { letter: 'D', text: 'evitar dificuldades que parecem ser intransponíveis.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'contestar circunstâncias que parecem ser harmônicas.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 6,
      statement: `(Enem 2024 / Língua Inglesa)
[Observe o anúncio publicitário e os comandos de computador na imagem de apoio]

O texto estabelece uma relação entre elementos da natureza e comandos de um programa de computador para:`,
      imageUrl: '/questoes/image5.png',
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa A. O cartaz adota a linguagem de comandos de software e exclusão rápida para alertar a sociedade sobre a velocidade devastadora com que a natureza vem sendo destruída pelo homem.',
      alternatives: [
        { letter: 'A', text: 'alertar as pessoas sobre a rápida destruição da natureza.', isCorrect: true, color: 'blue' },
        { letter: 'B', text: 'conscientizar os indivíduos sobre a passagem acelerada do tempo.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'apresentar aos leitores os avanços tecnológicos na área da agricultura.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'orientar os usuários sobre o emprego sustentável das novas tecnologias.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'informar os interessados sobre o tempo de crescimento de novas árvores.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 7,
      statement: `(ENEM 2023 / Filosofia Moderna — Descartes)
"Eu poderia concluir que a raiva é um pensamento, que estar com raiva é pensar que alguém é detestável, e que esse pensamento, como todos os outros — assim como Descartes o mostrou —, não poderia residir em nenhum fragmento de matéria. A raiva seria, portanto, espírito. Porém, quando me volto para minha própria experiência da raiva, devo confessar que ela não estava fora do meu corpo, mas inexplicavelmente nele."
(MERLEAU-PONTY, M. Quinta conversa: o homem visto de fora. São Paulo: Martins Fontes, 1948 - adaptado)

No que se refere ao problema do corpo, a filosofia cartesiana apresenta-se como contraponto ao entendimento expresso no texto por:`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa A. O texto de Merleau-Ponty parte da fenomenologia para defender que o sentimento é indissociável da corporeidade vivida, contrariando o dualismo cartesiano de substâncias (res cogitans versus res extensa).',
      alternatives: [
        { letter: 'A', text: 'Apresentar uma visão dualista.', isCorrect: true, color: 'blue' },
        { letter: 'B', text: 'Confirmar uma tese naturalista.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'Demonstrar uma premissa realista.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'Sustentar um argumento idealista.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'Defender uma posição intencionalista.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 8,
      statement: `(ENEM 2024 / Filosofia — Ética e Moral em Kant)
"A regra de ouro, popularmente conhecida pelo provérbio 'Trate os outros como gostaria de ser tratado', é um dos princípios morais mais onipresentes. A noção subjacente, que apela para o senso ético mais básico, se expressa de uma forma ou de outra em praticamente todas as tradições religiosas, e poucos filósofos morais deixaram de invocar a regra ou pelo menos de tecer comentários a respeito da relação com seus próprios princípios."
(DUPRÉ, B. 50 grandes ideias da humanidade. São Paulo: Planeta do Brasil, 2016)

O princípio ético apresentado no texto, como elemento estruturante da vida em sociedade, se traduz pela seguinte formulação teórica:`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa B. A universalização da conduta moral e a reciprocidade racional encontram no Imperativo Categórico de Kant a sua principal formulação filosófica deontológica moderna.',
      alternatives: [
        { letter: 'A', text: 'Doutrina teleológica.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'Imperativo categórico.', isCorrect: true, color: 'blue' },
        { letter: 'C', text: 'Pensamento utilitarista.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'Secularização inautêntica.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'Raciocínio consequencialista.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 9,
      statement: `(Química / Química Orgânica)
A gasolina é uma mistura de hidrocarbonetos de cadeias saturadas contendo de 8 a 12 átomos de carbono. Além disso, a gasolina de alto desempenho deve conter elevados teores de hidrocarbonetos de cadeias ramificadas, de forma a resistir à compressão e entrar em ignição apenas quando a vela aciona uma centelha elétrica no motor.

No quadro da imagem de apoio, estão apresentados compostos que podem ser utilizados como combustíveis:
I: octano (cadeia normal)
II: 2-metil-heptano
III: 2,2,4-trimetilpentano (isooctano)
IV: hexano
V: benzeno

Entre esses compostos, aquele que conferirá maior desempenho como combustível é o:`,
      imageUrl: '/questoes/image6.png',
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa C. O composto III é o 2,2,4-trimetilpentano (isooctano), alcano de 8 carbonos altamente ramificado que é o padrão de referência máxima de antidetonância (índice 100 de octanagem).',
      alternatives: [
        { letter: 'A', text: 'I.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'II.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'III.', isCorrect: true, color: 'blue' },
        { letter: 'D', text: 'IV.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'V.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 10,
      statement: `(Química / Físico-Química — Equilíbrio Químico)
Para a produção de titânio metálico ou dióxido de titânio puros, é necessário fazer a cloração do minério que contém dióxido de titânio, com o objetivo de separar esse óxido de outras substâncias presentes no minério. A principal reação química de cloração é representada por:

TiO2(s) + 2 Cl2(g)  ⇌  TiCl4(g) + O2(g)      ΔH = +175 kJ/mol

Depois da cloração, o tetracloreto de titânio é condensado e convertido, novamente, a dióxido de titânio.

Após o sistema atingir o equilíbrio químico, como a formação do TiCl4 pode ser favorecida?`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa D. Segundo o Princípio de Le Chatelier, o aumento da concentração/pressão parcial de um reagente gasoso (Cl2) desloca o equilíbrio no sentido direto, aumentando o rendimento de TiCl4.',
      alternatives: [
        { letter: 'A', text: 'Aumentando a pressão total do sistema.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'Diminuindo a temperatura do sistema.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'Aumentando a pressão parcial de O2.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'Aumentando a pressão parcial de Cl2.', isCorrect: true, color: 'blue' },
        { letter: 'E', text: 'Variando a quantidade de TiO2.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 11,
      statement: `(ENEM 2023 / Sociologia — Desigualdade de Gênero)
"Nas reportagens publicadas sobre a inauguração do Museu de Arte de São Paulo, em 1947, quando ele ainda ocupava um edifício na rua Sete de Abril, Lina Bo Bardi não foi mencionada nenhuma vez. A arquiteta era responsável pelo projeto do museu que mudaria para sempre a posição de São Paulo no circuito mundial das artes. Mas não houve nenhum registro disso. O louvor se concentrou em seu marido e parceiro profissional, o respeitado crítico de arte Pietro Maria Bardi. Passados 75 anos, a mulher então ignorada recebeu um Leão de Ouro póstumo, a maior homenagem da Bienal de Arquitetura de Veneza, e tem agora sua história contada em duas biografias de peso, que procuram destrinchar uma carreira marcada pela ousadia e pela contradição."
(PORTO, W. Folha de S.Paulo, 2021 - adaptado)

As transformações pelas quais passaram as sociedades ocidentais e que possibilitaram o reconhecimento recente do trabalho da arquiteta mencionada no texto foram resultado das mobilizações sociais pela:`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa A. O reconhecimento tardio da relevância de Lina Bo Bardi é fruto histórico das lutas feministas e sociais pela equidade de gênero e pelo fim da invisibilização da produção intelectual e artística feminina.',
      alternatives: [
        { letter: 'A', text: 'Equidade de gênero.', isCorrect: true, color: 'blue' },
        { letter: 'B', text: 'Liberdade de expressão.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'Admissibilidade de voto.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'Igualdade de oportunidade.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'Reciprocidade de tratamento.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 12,
      statement: `(ENEM 2024 / Sociologia — Cultura e Memória Coletiva)
"No primeiro dia, foi colocada uma panela de barro no centro do barracão, a qual representava o espírito do morto presente na sala. Aqueles que dançavam depositavam moedas ao passarem junto dela e, ao seu redor, milho branco, mel, água, acaçás, cachaça. No segundo dia, os ogãs, antes de iniciar a cerimônia, caminharam pelo corredor formado pelas casas, batendo com longas varas de bambus nos seus beirais, até alcançarem o portão de entrada. No terceiro dia, quatro pessoas, as mais influentes do culto, carregaram um lençol, que aparentemente continha um corpo em seu interior. No entanto, esse corpo era formado por folhas verdes de plantas, que foram derramadas sobre uma pessoa."
(MANZOCHI, H. M. Axexe, um rito de passagem. Revista do Museu de Arqueologia e Etnologia, 1995 - adaptado)

O ritual brasileiro apresentado no texto representa, para seus adeptos, a:`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa A. O rito tradicional de passagem no candomblé preserva e renova a memória coletiva e o sentimento comunitário de continuidade cultural entre ancestrais e viventes.',
      alternatives: [
        { letter: 'A', text: 'manutenção de uma memória coletiva.', isCorrect: true, color: 'blue' },
        { letter: 'B', text: 'contestação de uma identidade étnica.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'imolação de uma divindade africana.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'legitimação de uma prática pagã.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'promissão de uma revolta social.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 13,
      statement: `(Língua Portuguesa / Texto e Tecnologia)
"A realidade aumentada é uma versão aprimorada e interativa de um ambiente real obtido por meio de elementos visuais, sonoros e outros estímulos sensoriais digitais por meio de tecnologia holográfica. A RA incorpora três recursos: uma combinação de mundos digitais e físicos, as interações feitas em tempo real e a identificação 3D exata de objetos virtuais e reais. A RA oferece uma maneira melhor de criar, auxiliar e fornecer instruções de consumo ao sobrepor conteúdo digital em ambientes de trabalho. Quando uma empresa entende o que é a RA e como utilizá-la, todos podem trabalhar remotamente e colaborar com eficiência. [...] No local de trabalho, adicionar realidade aumentada aos processos pode ajudar a melhorar os benefícios de aprendizado e compreensão para os funcionários."
(Dynamics 365 Guides - adaptado)

De acordo com o texto, um benefício inovador da realidade aumentada para o desenvolvimento da sociedade está relacionado à possibilidade de:`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa E. A essência definidora da Realidade Aumentada (RA) consiste em enriquecer e mesclar o espaço real e concreto com dados e objetos virtuais interativos em tempo real.',
      alternatives: [
        { letter: 'A', text: 'ajudar na alocação e no aprendizado de funcionários do ramo tecnológico.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'aprender habilidades profissionais provenientes dos avanços da identificação 3D.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'incorporar recursos virtuais que complementam o uso de objetos do mundo físico.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'aprimorar o ambiente profissional por meio da criação de mundos virtuais do zero.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'promover interações em que sejam inseridos elementos virtuais em ambientes reais.', isCorrect: true, color: 'blue' },
      ],
    },
    {
      order: 14,
      statement: `(Enem 2019 / Linguagens — Funções da Linguagem)
"O Instituto de Arte de Chicago disponibilizou para visualização on-line, compartilhamento ou download (sob licença Creative Commons), 44 mil imagens de obras de arte em altíssima resolução, além de livros, estudos e pesquisas sobre a história da arte.
Para o historiador da arte, Bendor Grosvenor, o sucesso das coleções on-line de acesso aberto, além de democratizar a arte, vem ajudando a formar um novo público museológico. Grosvenor acredita que quanto mais pessoas forem expostas à arte on-line, mais visitas pessoais acontecerão aos museus.
A coleção está disponível em seis categorias: paisagens urbanas, impressionismo, essenciais, arte africana, moda e animais. Também é possível pesquisar pelo nome da obra, estilo, autor ou período. Para navegar pela imagem em alta definição, basta clicar sobre ela e utilizar a ferramenta de zoom. Para fazer o download, disponível para obras de domínio público, é preciso utilizar a seta localizada do lado inferior direito da imagem."
(Disponível em: www.revistabula.com)

A função da linguagem que predomina nesse texto se caracteriza por:`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa C. A função referencial ou informativa predomina, pois o texto visa fornecer instruções precisas e objetivas ao leitor sobre o acervo e o procedimento técnico para acessar e baixar as imagens.',
      alternatives: [
        { letter: 'A', text: 'evidenciar a subjetividade da reportagem com base na fala do historiador de arte.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'convencer o leitor a fazer o acesso on-line, levando-o a conhecer as obras de arte.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'informar sobre o acesso às imagens por meio da descrição do modo como acessá-las.', isCorrect: true, color: 'blue' },
        { letter: 'D', text: 'estabelecer interlocução com o leitor, orientando-o a fazer o download das obras de arte.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'enaltecer a arte, buscando popularizá-la por meio da possibilidade de visualização on-line.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 15,
      statement: `(História do Brasil / Período Joanino e Missões Artísticas)
"Nas primeiras décadas do século XIX, ocorreu uma verdadeira 'redescoberta do Brasil', como identificou Mary Pratt, graças à ação de inúmeros viajantes europeus, bem como as Missões Artísticas e Científicas que percorreram o território, colhendo diversas informações sobre o que aqui existia. Foram registrados os diversos grupos humanos encontrados, legando-nos um retrato de diversos tipos sociais. Rica e fundamental foi a descrição que fizeram da natureza, revelando ao mundo diferenciadas flora e fauna. Entretanto, até o início dos oitocentos, os estrangeiros foram proibidos de percorrer as terras brasileiras e eram quase sempre vistos como espiões e agentes de outros países."

O grande afluxo de artistas e cientistas estrangeiros ao Brasil está ligado:`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa A. A instalação da Corte no Rio de Janeiro motivou uma série de iniciativas modernizadoras e a contratação da célebre Missão Artística Francesa para criar a Academia Imperial de Belas Artes.',
      alternatives: [
        { letter: 'A', text: 'à política joanina, no sentido de modernizar o Rio de Janeiro, inclusive com o projeto de criar uma escola de ciências, artes e ofícios.', isCorrect: true, color: 'blue' },
        { letter: 'B', text: 'à pressão exercida pela Inglaterra, para que o governo de Dom João permitisse a entrada de cientistas e artistas no Brasil.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'à transferência da capital do Império Português de Salvador para o Rio de Janeiro, modificando o eixo econômico da colônia.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'à reafirmação do pacto colonial, em função das proposições liberais da Revolução do Porto.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'à política de vários países europeus, que buscavam ampliar o conhecimento geral sobre o mundo, na esteira do humanismo platônico.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 16,
      statement: `(História do Brasil / Redemocratização e Constituição de 1988)
Em 5 de outubro de 1988 foi promulgada a Constituição que se encontra em vigência no Brasil. A respeito da história da construção e da aplicação dessa Constituição, considere as seguintes afirmativas:

1. Essa Constituição ampliou os direitos civis, políticos e sociais, tais como a previdência social, a proteção à maternidade e à infância e a garantia ao acesso universal à educação e à saúde.
2. Após 30 anos da promulgação dessa constituição, comemora-se o cumprimento do item III do artigo 3º da Constituição: “erradicar a pobreza e a marginalização e reduzir as desigualdades sociais e regionais”.
3. Essa Constituição foi elaborada por uma Assembleia Nacional Constituinte eleita por voto indireto em colégio eleitoral, por conta da rejeição da emenda das “Diretas Já” pelo Congresso Nacional.
4. Essa Constituição foi elaborada com a finalidade de romper com o período da ditadura civil-militar (1964-1985) e atender ao processo de redemocratização.

Assinale a alternativa correta:`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa B. A afirmativa 1 é correta (cidadania plena e direitos sociais). A afirmativa 2 é incorreta (as desigualdades e a pobreza não foram erradicadas). A afirmativa 3 é incorreta (os constituintes de 1986 foram eleitos por voto direto). A afirmativa 4 é correta (marco da redemocratização).',
      alternatives: [
        { letter: 'A', text: 'Somente a afirmativa 1 é verdadeira.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'Somente as afirmativas 1 e 4 são verdadeiras.', isCorrect: true, color: 'blue' },
        { letter: 'C', text: 'Somente as afirmativas 2 e 3 são verdadeiras.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'Somente as afirmativas 2, 3 e 4 são verdadeiras.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'As afirmativas 1, 2, 3 e 4 são verdadeiras.', isCorrect: false, color: 'blue' },
      ],
    },
    {
      order: 17,
      statement: `(Enem / Literatura Brasileira)
Texto I:
"Eles se beijavam no elevador, nos corredores do prédio. Se amavam tanto, que o vizinho solteirão da esquerda guardava por eles uma vermelha inveja. Uma tarde, sem que ninguém soubesse por que, eles se enforcaram no banheiro. Houve muito tumulto, carros da polícia parados em frente ao edifício, as equipes de TV. [...] Enquanto isso, o solteirão, na janela do seu apartamento, vendo todos lá embaixo, mordia com sabor a carne acesa de uma enorme goiaba."
(FERNANDES, R. O caçador, 1997 - fragmento)

Texto II:
"Invejoso / O carro do vizinho é muito mais possante / E aquela mulher dele é tão interessante / Por isso ele parece muito mais potente [...] / Invejoso / Querer o que é dos outros é o seu gozo / E fica remoendo até o osso / Mas sua fruta só lhe dá o caroço / Invejoso / O bem alheio é o seu desgosto..."
(ANTUNES, A. Iê Iê Iê, 2009 - fragmento)

O conto e a letra de canção abordam o mesmo tema, a inveja. Embora empreguem recursos linguísticos diferentes, ambos lançam mão de um mecanismo em comum, que consiste em:`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa E. Ambos os textos desnudam os traços psicológicos e as pulsões internas de quem experimenta a inveja, retratando o prazer e a obsessão mórbida na vida alheia.',
      alternatives: [
        { letter: 'A', text: 'referir-se, em terceira pessoa, a um indivíduo qualificado como invejoso.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'conferir à inveja aspectos humanos ao fazer dela personagem de narrativa.', isCorrect: false, color: 'blue' },
        { letter: 'C', text: 'expressar o ponto de vista do invejoso por meio da fala de uma personagem.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'dissertar sobre a inveja, apresentando argumentos contrários e favoráveis.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'fazer uma descrição do perfil psicológico de alguém caracterizado como invejoso.', isCorrect: true, color: 'blue' },
      ],
    },
    {
      order: 18,
      statement: `(Enem / Literatura — Modernismo e Poesia)
"O rio que fazia uma volta atrás de nossa casa era a imagem de um vidro mole que fazia uma volta atrás de casa.
Passou um homem e disse: Essa volta que o rio faz por trás de sua casa se chama enseada.
Não era mais a imagem de uma cobra de vidro que fazia uma volta atrás de casa.
Era uma enseada.
Acho que o nome empobreceu a imagem."
(BARROS, M. O livro das ignorãças. Rio de Janeiro: Best Seller, 2008)

O sujeito poético questiona o uso do vocábulo “enseada” porque a:`,
      imageUrl: null,
      points: 100,
      explanation: 'Gabarito Oficial: Alternativa B. A catalogação técnica e racional da palavra restringe a liberdade da imaginação metafórica infantil e desvaloriza a percepção poética e subjetiva original.',
      alternatives: [
        { letter: 'A', text: 'terminologia mencionada é incorreta.', isCorrect: false, color: 'blue' },
        { letter: 'B', text: 'nomeação minimiza a percepção subjetiva.', isCorrect: true, color: 'blue' },
        { letter: 'C', text: 'palavra é aplicada a outro espaço geográfico.', isCorrect: false, color: 'blue' },
        { letter: 'D', text: 'designação atribuída ao termo é desconhecida.', isCorrect: false, color: 'blue' },
        { letter: 'E', text: 'definição modifica o significado do termo no dicionário.', isCorrect: false, color: 'blue' },
      ],
    },
  ],
};
