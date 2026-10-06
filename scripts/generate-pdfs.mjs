import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pdfDir = path.resolve(__dirname, '../PDF');

if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

const jsonPath = path.resolve(__dirname, '../lib/driveLinks.json');
let DRIVE_LINKS = {
  basic: 'https://drive.google.com/drive/folders/COLE_AQUI_SEU_LINK_DO_DRIVE_BASICO',
  premium: 'https://drive.google.com/drive/folders/COLE_AQUI_SEU_LINK_DO_DRIVE_PREMIUM',
};

if (fs.existsSync(jsonPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (raw.basicDriveLink) DRIVE_LINKS.basic = raw.basicDriveLink;
    if (raw.premiumDriveLink) DRIVE_LINKS.premium = raw.premiumDriveLink;
  } catch (e) {
    console.warn('Aviso: Falha ao carregar driveLinks.json, usando padrao.');
  }
}

async function createBasicPDF() {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([595.28, 841.89]); // Formato A4
  const { width, height } = page.getSize();

  // Fundo do cabeçalho
  page.drawRectangle({
    x: 0,
    y: height - 160,
    width: width,
    height: 160,
    color: rgb(0.06, 0.09, 0.13), // Slate 900
  });

  // Linha de detalhe azul neon
  page.drawRectangle({
    x: 0,
    y: height - 163,
    width: width,
    height: 3,
    color: rgb(0, 0.52, 1), // Azul Prime
  });

  // Título e Logo
  page.drawText('PRIME STL', {
    x: 50,
    y: height - 70,
    size: 28,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('GUIA OFICIAL DE ACESSO — PLANO BASICO', {
    x: 50,
    y: height - 95,
    size: 13,
    font: fontBold,
    color: rgb(0.27, 0.78, 1),
  });

  page.drawText('1.000 Modelos 3D Selecionados para Impressao FDM e Resina', {
    x: 50,
    y: height - 120,
    size: 10,
    font: fontRegular,
    color: rgb(0.7, 0.75, 0.8),
  });

  // Corpo do documento
  let currentY = height - 200;

  page.drawText('Parabens pela sua compra!', {
    x: 50,
    y: currentY,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  currentY -= 25;
  const textoIntro =
    'Seu acesso ao acervo digital do Plano Basico foi liberado com sucesso. Abaixo voce encontra o link exclusivo para acessar e baixar todos os seus modelos STL.';
  page.drawText(textoIntro, {
    x: 50,
    y: currentY,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.4),
    maxWidth: width - 100,
    lineHeight: 15,
  });

  // Caixa de Acesso ao Google Drive
  currentY -= 60;
  page.drawRectangle({
    x: 50,
    y: currentY - 50,
    width: width - 100,
    height: 75,
    color: rgb(0.95, 0.97, 1),
    borderColor: rgb(0, 0.52, 1),
    borderWidth: 1.5,
  });

  page.drawText('LINK DE ACESSO AOS ARQUIVOS (GOOGLE DRIVE):', {
    x: 70,
    y: currentY + 6,
    size: 10,
    font: fontBold,
    color: rgb(0, 0.35, 0.75),
  });

  page.drawText(DRIVE_LINKS.basic, {
    x: 70,
    y: currentY - 14,
    size: 10,
    font: fontBold,
    color: rgb(0, 0.45, 0.9),
  });

  page.drawText('(Clique duas vezes ou copie o link acima e cole no navegador para acessar)', {
    x: 70,
    y: currentY - 32,
    size: 8,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  // O que esta incluso no plano basico
  currentY -= 95;
  page.drawText('O QUE ESTA INCLUSO NO SEU PLANO:', {
    x: 50,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  currentY -= 20;
  const itensInclusos = [
    '• 1.000 arquivos STL selecionados e testados para fatiamento.',
    '• Organizacao categorizada: Personagens, Decoracao e Colecionaveis.',
    '• Acesso vitalicio: baixe quantas vezes precisar.',
    '• Arquivos compatíveis com fatiadores Cura, Bambu Studio, OrcaSlicer e PrusaSlicer.',
  ];

  itensInclusos.forEach((item) => {
    page.drawText(item, {
      x: 60,
      y: currentY,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.25, 0.3, 0.35),
    });
    currentY -= 18;
  });

  // Dicas essenciais de fatiamento
  currentY -= 15;
  page.drawText('DICAS RAPIDAS DE FATIAMENTO & IMPRESSAO:', {
    x: 50,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  currentY -= 20;
  const dicas = [
    '1. Altura de Camada: 0.16mm ou 0.20mm para modelos decorativos (equilibrio entre tempo e acabamento).',
    '2. Preenchimento (Infill): 10% a 15% padrao Giroide (Gyroid) oferece excelente rigidez estrutural.',
    '3. Suportes: Recomendamos Suportes em Arvore (Tree Support) para facilitar a remocao e economizar filamento.',
    '4. Temperatura PLA: 200C a 210C no bico / 50C a 60C na mesa aquecida.',
  ];

  dicas.forEach((dica) => {
    page.drawText(dica, {
      x: 60,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
      maxWidth: width - 120,
      lineHeight: 13,
    });
    currentY -= 22;
  });

  // Rodapé
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 45,
    color: rgb(0.96, 0.97, 0.98),
    borderColor: rgb(0.88, 0.9, 0.92),
    borderWidth: 1,
  });

  page.drawText('PRIME STL — Guia Oficial do Usuário | Biblioteca de Modelos 3D', {
    x: 50,
    y: 18,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.45, 0.5, 0.55),
  });

  const pdfBytes = await pdfDoc.save();
  const filePath = path.join(pdfDir, 'PRIME STL Básico.pdf');
  fs.writeFileSync(filePath, pdfBytes);
  console.log(`✅ PDF Criado: ${filePath}`);
}

async function createPremiumPDF() {
  const pdfDoc = await pdfDocCreate();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Página 1: Acesso VIP, Links e Categorias
  const page1 = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page1.getSize();

  // Cabeçalho Premium com destaque dourado/ciano
  page1.drawRectangle({
    x: 0,
    y: height - 165,
    width: width,
    height: 165,
    color: rgb(0.05, 0.07, 0.1),
  });

  page1.drawRectangle({
    x: 0,
    y: height - 168,
    width: width,
    height: 3,
    color: rgb(0, 0.85, 0.65), // Verde Esmeralda / Teal VIP
  });

  page1.drawText('PRIME STL', {
    x: 50,
    y: height - 65,
    size: 28,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('GUIA VIP DE ACESSO COMPLETO — PLANO PREMIUM', {
    x: 50,
    y: height - 90,
    size: 13,
    font: fontBold,
    color: rgb(0.2, 0.9, 0.7),
  });

  page1.drawText('150.000+ Modelos STL + 14 Colecoes Extras Exclusivas de Bonus', {
    x: 50,
    y: height - 115,
    size: 10,
    font: fontRegular,
    color: rgb(0.75, 0.8, 0.85),
  });

  let currentY = height - 200;

  page1.drawText('Bem-vindo ao Acesso Completo PRIME STL!', {
    x: 50,
    y: currentY,
    size: 15,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  currentY -= 22;
  page1.drawText(
    'Voce adquiriu o pacote mais completo de impressao 3D. Alem de toda a base com mais de 150 mil arquivos, voce possui acesso irrestrito as 14 colecoes extras de alta demanda.',
    {
      x: 50,
      y: currentY,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
      maxWidth: width - 100,
      lineHeight: 14,
    }
  );

  // Caixa de Link VIP do Google Drive
  currentY -= 65;
  page1.drawRectangle({
    x: 50,
    y: currentY - 50,
    width: width - 100,
    height: 75,
    color: rgb(0.94, 0.99, 0.97),
    borderColor: rgb(0, 0.75, 0.55),
    borderWidth: 1.5,
  });

  page1.drawText('LINK VIP DE ACESSO TOTAL AOS ARQUIVOS (GOOGLE DRIVE):', {
    x: 70,
    y: currentY + 6,
    size: 10,
    font: fontBold,
    color: rgb(0, 0.5, 0.35),
  });

  page1.drawText(DRIVE_LINKS.premium, {
    x: 70,
    y: currentY - 14,
    size: 10,
    font: fontBold,
    color: rgb(0, 0.6, 0.4),
  });

  page1.drawText('(Clique duas vezes ou copie o link acima e cole no navegador para acessar todas as pastas)', {
    x: 70,
    y: currentY - 32,
    size: 8,
    font: fontRegular,
    color: rgb(0.35, 0.45, 0.4),
  });

  // Lista das 14 Coleções Extras Bônus
  currentY -= 90;
  page1.drawText('AS 14 COLECOES EXTRAS INCLUSAS NO SEU ACESSO:', {
    x: 50,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  currentY -= 18;
  const col1 = [
    '1. Veiculos 3D (+172 carros/motos)',
    '2. Herois Marvel (+150 modelos)',
    '3. Chaveiros Criativos (+500 ideias)',
    '4. Flexiveis & Articulados (+1.300 modelos)',
    '5. Classicos dos Desenhos Animados',
    '6. Cosplay & Mascaras Funcionais',
    '7. Colecao Completa Pokemon (+450 modelos)',
  ];

  const col2 = [
    '8. Especial de Natal & Festividades',
    '9. Copa do Mundo & Trofeus',
    '10. Mascotes Esportivos & Times',
    '11. Luminarias STL Decorativas (+250)',
    '12. Amigurumi 3D (Textura croche)',
    '13. Colecao Minifiguras Lego 3D',
    '14. Universo Minecraft Modular',
  ];

  const startListY = currentY;
  col1.forEach((item) => {
    page1.drawText(item, {
      x: 60,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.3),
    });
    currentY -= 16;
  });

  let currentY2 = startListY;
  col2.forEach((item) => {
    page1.drawText(item, {
      x: 320,
      y: currentY2,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.3),
    });
    currentY2 -= 16;
  });

  // Página 2: Dicas de Alta Performance e Suporte
  const page2 = pdfDoc.addPage([595.28, 841.89]);

  // Mini-topo da Página 2
  page2.drawRectangle({
    x: 0,
    y: height - 55,
    width: width,
    height: 55,
    color: rgb(0.05, 0.07, 0.1),
  });

  page2.drawText('PRIME STL PREMIUM — MANUAL DE ALTA PERFORMANCE EM IMPRESSAO', {
    x: 50,
    y: height - 35,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.9, 0.7),
  });

  let p2Y = height - 90;

  page2.drawText('RECOMENDACOES PROFISSIONAIS DE IMPRESSAO:', {
    x: 50,
    y: p2Y,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  p2Y -= 25;
  const recomendacoes = [
    {
      titulo: 'Orientacao da Peca no Fatiador:',
      desc: 'Rotacione o modelo para que os detalhes mais criticos nao fiquem em contato com os suportes. Para estatuas e figuras, incline o tronco em 45 graus para reduzir marcas de camadas.',
    },
    {
      titulo: 'Suporte em Arvore (Tree / Organic Support):',
      desc: 'Fundamental para figuras complexas e articulados. Economiza ate 60% de material em relacao ao suporte normal e sai facilmente com a mao.',
    },
    {
      titulo: 'Pecas Articuladas (Print-in-Place):',
      desc: 'Nunca ative suportes em modelos articulados! Garanta que o fluxo de extrusao esteja calibrado em 100% para que as juntas nao grudem durante a impressao.',
    },
    {
      titulo: 'Luminarias & Lithophanes:',
      desc: 'Para litofanias e cúpulas de luminarias, utilize 100% de preenchimento e 4 paredes para permitir a difusao perfeita da luz LED.',
    },
  ];

  recomendacoes.forEach((rec) => {
    page2.drawText(rec.titulo, {
      x: 50,
      y: p2Y,
      size: 10.5,
      font: fontBold,
      color: rgb(0, 0.45, 0.65),
    });
    p2Y -= 15;
    page2.drawText(rec.desc, {
      x: 50,
      y: p2Y,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.4),
      maxWidth: width - 100,
      lineHeight: 14,
    });
    p2Y -= 32;
  });

  // Avisos legais e suporte
  p2Y -= 20;
  page2.drawRectangle({
    x: 50,
    y: p2Y - 70,
    width: width - 100,
    height: 70,
    color: rgb(0.96, 0.97, 0.98),
    borderColor: rgb(0.85, 0.88, 0.9),
    borderWidth: 1,
  });

  page2.drawText('SUPORTE & ORIENTACOES:', {
    x: 70,
    y: p2Y - 18,
    size: 10,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.25),
  });

  page2.drawText(
    'Caso tenha duvidas sobre os arquivos ou precise de suporte, acesse a area de membros ou consulte o manual de impressao 3D.',
    {
      x: 70,
      y: p2Y - 35,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.5),
      maxWidth: width - 140,
      lineHeight: 12,
    }
  );

  // Rodapé página 2
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 45,
    color: rgb(0.96, 0.97, 0.98),
    borderColor: rgb(0.88, 0.9, 0.92),
    borderWidth: 1,
  });

  page2.drawText('PRIME STL PREMIUM — Guia Oficial do Usuário | Acesso Vitalicio Garantido', {
    x: 50,
    y: 18,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.45, 0.5, 0.55),
  });

  const pdfBytes = await pdfDoc.save();
  const filePath = path.join(pdfDir, 'PRIME STL Premium.pdf');
  fs.writeFileSync(filePath, pdfBytes);
  console.log(`✅ PDF Criado: ${filePath}`);
}

async function pdfDocCreate() {
  return await PDFDocument.create();
}

async function main() {
  console.log('Iniciando geracao dos PDFs...');
  await createBasicPDF();
  await createPremiumPDF();

  const publicDownloadsDir = path.resolve(__dirname, '../public/downloads');
  if (!fs.existsSync(publicDownloadsDir)) {
    fs.mkdirSync(publicDownloadsDir, { recursive: true });
  }

  fs.copyFileSync(
    path.join(pdfDir, 'PRIME STL Básico.pdf'),
    path.join(publicDownloadsDir, 'PRIME STL Básico.pdf')
  );
  fs.copyFileSync(
    path.join(pdfDir, 'PRIME STL Premium.pdf'),
    path.join(publicDownloadsDir, 'PRIME STL Premium.pdf')
  );

  console.log('✅ Arquivos sincronizados em public/downloads para o Next.js');
  console.log('Processo finalizado com sucesso!');
}

main().catch(console.error);
