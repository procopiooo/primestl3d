import fs from 'fs';
import path from 'path';

export async function getServerSideProps({ res }) {
  try {
    let htmlPath = path.join(process.cwd(), 'index.html');
    if (!fs.existsSync(htmlPath)) {
      htmlPath = path.join(process.cwd(), 'public', 'index.html');
    }
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.write(htmlContent);
    res.end();
  } catch (error) {
    console.error('[PAGES_INDEX] Erro ao servir index.html:', error);
    res.statusCode = 500;
    res.end('Erro ao carregar página inicial.');
  }

  return { props: {} };
}

export default function HomePage() {
  return null;
}
