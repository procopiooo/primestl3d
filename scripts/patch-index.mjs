import fs from 'fs';
import path from 'path';

const sourcePath = path.resolve('junin/index.html');
const destPath = path.resolve('index.html');

console.log('Reading pristine source from:', sourcePath);
let html = fs.readFileSync(sourcePath, 'utf8');

// 1. Remove all guarantee/warranty and refund mentions
console.log('Removing warranty, refund, and 14 days mentions...');

// JSON-LD
html = html.replace(
  'orias, com 14 coleções extras, acesso vitalício e garantia incondicional de 14 dias.',
  'orias, com 14 coleções extras, acesso vitalício e download imediato.'
);

// Hero badge
html = html.replace(
  '· Garantia de 14 dias',
  '· Download imediato'
);

// Bonus list
html = html.replace(
  '<li>Garantia incondicional de 14 dias</li>',
  '<li>Guia completo em PDF com todos os links</li>'
);

// Section 11 Guarantee
html = html.replace(/<!-- 11 · Garantia -->[\s\S]*?<\/section>\s*/, '');

// Footer text
html = html.replace(
  '14 dias para explorar com tranquilidade.',
  'Comece a imprimir hoje mesmo.'
);

// 2. Add "Área de Membros" to Header (WITHOUT key icon)
console.log('Adding Área de Membros to Header navigation...');
html = html.replace(
  '<a class="nav-cta" href="#planos">Conhecer os planos ↗</a>',
  '<a href="/login" style="color:#38bdf8;font-weight:600">Área de Membros</a><a class="nav-cta" href="#planos">Conhecer os planos ↗</a>'
);

// 3. Add "Área de Membros" to Footer
console.log('Adding Área de Membros to Footer...');
html = html.replace(
  '<p>© <span id="year">2026</span> PRIME STL. Todos os direitos reservados.</p>',
  '<p>© <span id="year">2026</span> PRIME STL. Todos os direitos reservados. · <a href="/login" style="color:#0284c7;font-weight:600">Área de Membros</a></p>'
);

// 4. Add Checkout Modal dialog right after media-dialog
console.log('Adding Checkout Modal Dialog...');
const checkoutDialogHtml = `
<dialog id="checkout-dialog" aria-labelledby="checkout-dialog-title" style="max-width: 480px; width: calc(100% - 32px); border-radius: 20px; border: 1px solid #1e293b; background: #0f172a; color: #f8fafc; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.8); overflow: hidden; padding: 0;">
  <div class="dialog-top" style="background: #0b1120; border-bottom: 1px solid #1e293b; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between;">
    <div>
      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #38bdf8; font-weight: 700; display: block; margin-bottom: 3px;">Área de Membros & Download Imediato</span>
      <h3 id="checkout-dialog-title" style="color: #ffffff; font-size: 18px; margin: 0; font-weight: 700;">Finalizar Pedido</h3>
    </div>
    <button class="close" id="checkout-close" aria-label="Fechar janela" style="background: #1e293b; color: #94a3b8; border: 0; border-radius: 50%; width: 32px; height: 32px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
  </div>
  <div class="dialog-body" style="padding: 24px; background: #0f172a;">
    <div id="checkout-plan-badge" style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <span style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 2px;">Plano Selecionado</span>
        <strong id="checkout-plan-name" style="color: #fff; font-size: 15px;">PRIME STL Premium</strong>
      </div>
      <div id="checkout-plan-price" style="font-size: 19px; font-weight: 800; color: #38bdf8;">R$ 37,90</div>
    </div>

    <form id="checkout-form" style="display: flex; flex-direction: column; gap: 14px;">
      <div>
        <label for="co-name" style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px;">Seu Nome Completo</label>
        <input id="co-name" type="text" required placeholder="Ex: Lucas Pereira" style="width: 100%; box-sizing: border-box; background: #030712; border: 1px solid #334155; border-radius: 10px; padding: 12px 14px; font-size: 14px; color: #fff; outline: none;">
      </div>

      <div>
        <label for="co-phone" style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px;">WhatsApp / Telefone (com DDD)</label>
        <input id="co-phone" type="text" required placeholder="(11) 99999-9999" maxlength="15" style="width: 100%; box-sizing: border-box; background: #030712; border: 1px solid #334155; border-radius: 10px; padding: 12px 14px; font-size: 14px; color: #fff; font-family: monospace; outline: none;">
      </div>

      <div>
        <label for="co-password" style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px;">Crie sua Senha de Acesso</label>
        <div style="position: relative;">
          <input id="co-password" type="password" required minlength="6" placeholder="Mínimo 6 dígitos" style="width: 100%; box-sizing: border-box; background: #030712; border: 1px solid #334155; border-radius: 10px; padding: 12px 42px 12px 14px; font-size: 14px; color: #fff; outline: none;">
          <button type="button" id="toggle-co-pw" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent; border: 0; color: #94a3b8; font-size: 12px; cursor: pointer; padding: 4px;">Ver</button>
        </div>
      </div>

      <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 10px; padding: 10px 12px; font-size: 11px; color: #bae6fd; line-height: 1.4;">
        ✓ Você usará seu <strong>Telefone</strong> e <strong>Senha</strong> para entrar na Área de Membros e baixar seu PDF e arquivos a qualquer momento.
      </div>

      <div id="checkout-error" style="display: none; background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 10px; padding: 10px 12px; font-size: 12px; color: #fb7185;"></div>

      <button type="submit" id="checkout-submit" style="margin-top: 6px; width: 100%; border: 0; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #fff; font-weight: 700; font-size: 15px; padding: 14px 18px; border-radius: 12px; cursor: pointer; transition: all .2s; box-shadow: 0 4px 14px rgba(37,99,235,0.3);">
        Ir para Pagamento Seguro ➔
      </button>
    </form>
  </div>
</dialog>`;

const mediaDialogEndTag = '</dialog>';
const mediaDialogIndex = html.indexOf(mediaDialogEndTag);
if (mediaDialogIndex === -1) {
  throw new Error('media-dialog not found');
}
html = html.slice(0, mediaDialogIndex + mediaDialogEndTag.length) + '\n' + checkoutDialogHtml + html.slice(mediaDialogIndex + mediaDialogEndTag.length);

// 5. Add Checkout JavaScript logic and update plan click handler
console.log('Wiring up Checkout logic in scripts...');

const targetOldClick = `document.addEventListener('click',e=>{const m=e.target.closest('[data-model]'),im=e.target.closest('[data-image]'),p=e.target.closest('[data-plan]');if(m){const x=models[+m.dataset.model];showDialog(x.name,\`<div class="model-detail"><img src="\${asset(\`\${x.img}\`)}" alt="\${x.name}"><div><span class="bonus-pill">SELEÇÃO DE MODELOS</span><h4>\${x.name}</h4><p>\${x.type}<br>Uma referência para explorar novas ideias com sua impressora 3D. Confira a licença e a compatibilidade do arquivo antes de imprimir.</p><a class="btn" href="#planos" onclick="document.getElementById('media-dialog').close()">Conhecer os planos \${ARROW}</a></div></div>\`)}if(im)showDialog(im.dataset.title,\`<img src="\${asset(\`\${im.dataset.image}\`)}" alt="\${im.dataset.title}"><p>Material da página de referência, apresentado exclusivamente nesta prévia visual.</p>\`);if(p){const premium=p.dataset.plan==='premium',url=premium?PRIME_CONFIG.checkoutPremium:PRIME_CONFIG.checkoutBasic;if(url){location.assign(url);return}showDialog('Prévia da oferta',\`<div class="checkout-panel"><div class="eyebrow">PRIME STL</div><h4>\${premium?'Acesso Premium':'Acesso Básico'}</h4><div class="price">R$ \${premium?'37,90':'9,90'}</div><p>Esta página é uma prévia visual. O pagamento ainda não está disponível. Os preços e condições seguem a referência e devem ser confirmados para a PRIME STL.</p><button class="btn" onclick="document.getElementById('media-dialog').close()">Continuar explorando \${ARROW}</button></div>\`)}});`;

const newCheckoutScriptLogic = `
const checkoutDialog=document.getElementById('checkout-dialog');
const checkoutClose=document.getElementById('checkout-close');
const checkoutForm=document.getElementById('checkout-form');
const coNameInput=document.getElementById('co-name');
const coPhoneInput=document.getElementById('co-phone');
const coPasswordInput=document.getElementById('co-password');
const toggleCoPwBtn=document.getElementById('toggle-co-pw');
const checkoutErrorEl=document.getElementById('checkout-error');
const checkoutSubmitBtn=document.getElementById('checkout-submit');
const checkoutPlanNameEl=document.getElementById('checkout-plan-name');
const checkoutPlanPriceEl=document.getElementById('checkout-plan-price');
let currentCheckoutPlan='premium';

function openCheckout(planId){
  currentCheckoutPlan=planId==='basic'?'basic':'premium';
  if(currentCheckoutPlan==='basic'){
    checkoutPlanNameEl.textContent='PRIME STL Básico — 1.000 Modelos';
    checkoutPlanPriceEl.textContent='R$ 9,90';
  } else {
    checkoutPlanNameEl.textContent='PRIME STL Premium — Acesso Total + 14 Bônus';
    checkoutPlanPriceEl.textContent='R$ 37,90';
  }
  checkoutErrorEl.style.display='none';
  checkoutErrorEl.textContent='';
  checkoutSubmitBtn.disabled=false;
  checkoutSubmitBtn.textContent='Ir para Pagamento Seguro ➔';
  checkoutDialog.showModal();
  document.body.style.overflow='hidden';
  setTimeout(()=>coNameInput.focus(),50);
}

function closeCheckout(){
  checkoutDialog.close();
  document.body.style.overflow='';
}

if(checkoutClose)checkoutClose.addEventListener('click',closeCheckout);
if(checkoutDialog){
  checkoutDialog.addEventListener('click',e=>{
    if(e.target===checkoutDialog){
      const r=checkoutDialog.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){
        closeCheckout();
      }
    }
  });
  checkoutDialog.addEventListener('close',()=>{document.body.style.overflow=''});
}

if(coPhoneInput){
  coPhoneInput.addEventListener('input',e=>{
    let v=e.target.value.replace(/\\D/g,'').slice(0,11);
    if(v.length>6){
      e.target.value=\`(\${v.slice(0,2)}) \${v.slice(2,7)}-\${v.slice(7)}\`;
    }else if(v.length>2){
      e.target.value=\`(\${v.slice(0,2)}) \${v.slice(2)}\`;
    }else if(v.length>0){
      e.target.value=\`(\${v}\`;
    }else{
      e.target.value='';
    }
  });
}

if(toggleCoPwBtn&&coPasswordInput){
  toggleCoPwBtn.addEventListener('click',()=>{
    const isText=coPasswordInput.type==='text';
    coPasswordInput.type=isText?'password':'text';
    toggleCoPwBtn.textContent=isText?'Ver':'Ocultar';
  });
}

if(checkoutForm){
  checkoutForm.addEventListener('submit',async e=>{
    e.preventDefault();
    checkoutErrorEl.style.display='none';
    const name=coNameInput.value.trim();
    const phone=coPhoneInput.value.replace(/\\D/g,'');
    const senha=coPasswordInput.value;
    if(!name){
      checkoutErrorEl.textContent='Por favor, informe seu nome completo.';
      checkoutErrorEl.style.display='block';
      return;
    }
    if(phone.length<10){
      checkoutErrorEl.textContent='Informe um WhatsApp/telefone válido com DDD.';
      checkoutErrorEl.style.display='block';
      return;
    }
    if(senha.length<6){
      checkoutErrorEl.textContent='A senha precisa ter no mínimo 6 caracteres.';
      checkoutErrorEl.style.display='block';
      return;
    }
    checkoutSubmitBtn.disabled=true;
    checkoutSubmitBtn.textContent='Gerando Pagamento Seguro...';
    try{
      const res=await fetch('/api/checkout',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          planId:currentCheckoutPlan,
          payer:{name,telefone:phone,senha}
        })
      });
      const data=await res.json();
      if(!res.ok){
        throw new Error(data.error||'Erro ao iniciar pagamento.');
      }
      const redirectUrl=data.init_point||data.sandbox_init_point;
      if(redirectUrl){
        window.location.href=redirectUrl;
      }else{
        throw new Error('Link de pagamento não retornado pelo gateway.');
      }
    }catch(err){
      checkoutErrorEl.textContent=err.message||'Erro de conexão. Tente novamente.';
      checkoutErrorEl.style.display='block';
      checkoutSubmitBtn.disabled=false;
      checkoutSubmitBtn.textContent='Ir para Pagamento Seguro ➔';
    }
  });
}

document.addEventListener('click',e=>{const m=e.target.closest('[data-model]'),im=e.target.closest('[data-image]'),p=e.target.closest('[data-plan]');if(m){const x=models[+m.dataset.model];showDialog(x.name,\`<div class="model-detail"><img src="\${asset(\`\${x.img}\`)}" alt="\${x.name}"><div><span class="bonus-pill">SELEÇÃO DE MODELOS</span><h4>\${x.name}</h4><p>\${x.type}<br>Uma referência para explorar novas ideias com sua impressora 3D. Confira a licença e a compatibilidade do arquivo antes de imprimir.</p><a class="btn" href="#planos" onclick="document.getElementById('media-dialog').close()">Conhecer os planos \${ARROW}</a></div></div>\`)}if(im)showDialog(im.dataset.title,\`<img src="\${asset(\`\${im.dataset.image}\`)}" alt="\${im.dataset.title}"><p>Material da página de referência, apresentado exclusivamente nesta prévia visual.</p>\`);if(p){const planId=p.dataset.plan==='premium'?'premium':'basic';openCheckout(planId);return}});`;

if (!html.includes(targetOldClick)) {
  throw new Error('targetOldClick not found in html');
}
html = html.replace(targetOldClick, newCheckoutScriptLogic);

// 6. Verify conditions
console.log('Verifying guarantees removal...');
const remainingGuarantees = html.match(/garantia|reembolso|14 dias/gi);
if (remainingGuarantees) {
  throw new Error(`Guarantees still found: ${JSON.stringify(remainingGuarantees)}`);
}

console.log('Verifying Three.js and 3D Scene integrity...');
if (!html.includes('hero-scene')) {
  throw new Error('hero-scene missing!');
}
if (!html.includes('/* Cena 3D procedural. Three.js é a única biblioteca de execução. */')) {
  throw new Error('3D procedural scene missing!');
}
if (html.includes('[truncated for diff preview]')) {
  throw new Error('Truncated marker found!');
}
if (!html.includes('THREE.Scene') && !html.includes('new T.Scene()')) {
  throw new Error('THREE scene creation missing!');
}
if (html.includes('🔑')) {
  throw new Error('Key emoji found in html!');
}

fs.writeFileSync(destPath, html, 'utf8');
console.log('Successfully wrote', destPath, 'with length:', html.length, 'bytes.');
