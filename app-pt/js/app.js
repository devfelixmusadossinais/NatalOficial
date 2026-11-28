(async()=>{
 'use strict';
 const app=document.getElementById('app'),nav=document.getElementById('nav'),U=Telas,E=Estado;
 let data,segment='Todos',query='',last='',installPrompt,zoom=1;
 const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 function filter(){const target=document.getElementById('catalogo');if(!target)return;const fav=target.dataset.favorites==='true';const list=data.modelos.items.filter(m=>(E.premium()||(!m.embreve&&m.n<=45))&&(segment==='Todos'||m.segment===segment)&&norm(m.title).includes(norm(query))&&(!fav||E.get().favoritos.includes('modelos/'+m.n)));target.innerHTML=list.map(m=>U.card(m)).join('')||'<p class="vazio">Nenhum modelo encontrado.</p>';document.getElementById('contagem').textContent=list.length+' modelos';}
 function render(){if(!data)return;const route=location.hash.slice(1)||'inicio';let html,active=route;
  if(!E.acesso())html=U.gate();
  else if(route==='inicio')html=U.home(data);
  else if(route==='modelos'||route==='favoritos'){html=U.catalog(data,route==='favoritos');}
  else if(route==='bonus')html=U.bonuses();
  else if(route==='vitrine')html=U.store(data);
  else if(route==='upgrade')html=U.top()+U.upgrade();
  else if(route.startsWith('colecao/')){html=U.collection(data,route.split('/')[1]);active='vitrine';}
  else if(/^(modelo|pagina|ficha)\//.test(route)){const [mode,key,n]=route.split('/');html=U.reader(data,key,+n,mode==='pagina',mode==='ficha');active=key==='modelos'?'modelos':'vitrine';zoom=1;}
  else if(route==='tamanhos'||route.startsWith('bonus/')){html=E.premium()?U.maintenance(route==='tamanhos'?'Tabela de 3 tamanhos (1,5 m, 2 m, 3 m)':U.bonusNames[+route.split('/')[1]]):U.upgrade();active='bonus';}
  else html=U.top()+U.upgrade();
  app.innerHTML='<div class="'+(route!==last?'view':'')+'">'+html+'</div>';nav.hidden=!E.acesso();
  nav.innerHTML=[['inicio','home','Início'],['modelos','grid','Modelos'],['favoritos','heart','Favoritos'],['bonus','gift','Bónus'],['vitrine','bag','Vitrine']].map(([r,i,t])=>`<a href="#${r}" ${active===r?'aria-current="page"':''}>${U.ico(i)}${t}</a>`).join('');
  if(document.getElementById('busca')){document.getElementById('busca').value=query;document.querySelectorAll('[data-segment]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.segment===segment));filter();}
  if(last!==route){window.scrollTo(0,0);app.focus({preventScroll:true});}last=route;
 }
 document.addEventListener('input',e=>{if(e.target.id==='busca'){query=e.target.value;filter();}});
 document.addEventListener('click',async e=>{
  const pending=e.target.closest('[data-embreve="true"]');if(pending){e.preventDefault();document.getElementById('modal').innerHTML=U.comingSoon()+'<button class="btn block mt" data-action="close">Fechar</button>';document.getElementById('modal').showModal();return;}
  const seg=e.target.closest('[data-segment]');if(seg){segment=seg.dataset.segment;if(seg.tagName==='A'){query='';if(location.hash==='#modelos')render();return;}document.querySelectorAll('[data-segment]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.segment===segment));filter();return;}
  const checkout=e.target.closest('[data-checkout]');if(checkout&&CONFIG.ADDONS[checkout.dataset.checkout].checkout.startsWith('#')){e.preventDefault();document.getElementById('modal').innerHTML='<h2 id="modal-titulo">'+U.esc(CONFIG.ADDONS[checkout.dataset.checkout].titulo)+'</h2><p class="mt">'+U.esc(CONFIG.ADDONS[checkout.dataset.checkout].checkout)+'</p><button class="btn block mt" data-action="close">Fechar</button>';document.getElementById('modal').showModal();return;}
  const btn=e.target.closest('[data-action]');if(!btn)return;
  const action=btn.dataset.action;
  if(action==='close'){document.getElementById('modal').close();return;}
  if(action==='fav'||action==='feito'){const y=scrollY;E.toggle(action==='fav'?'favoritos':'feitos',btn.dataset.id);render();scrollTo(0,y);return;}
  if(action==='sair'){E.sair();render();return;}
  if(action==='fullscreen'){const reader=document.querySelector('.reader');try{if(document.fullscreenElement)await document.exitFullscreen();else await reader.requestFullscreen();}catch(_){window.open(document.getElementById('page-image').src,'_blank','noopener');}return;}
  if(action.startsWith('zoom-')){zoom=action==='zoom-reset'?1:Math.min(4,Math.max(1,zoom+(action==='zoom-in'?.5:-.5)));const im=document.getElementById('page-image');im.style.width=zoom*100+'%';im.style.maxWidth='none';return;}
  if(action==='install'){if(installPrompt){await installPrompt.prompt();installPrompt=null;}else{document.getElementById('modal').innerHTML='<h2 id="modal-titulo">Instalar app</h2><p class="mt">No menu do navegador, escolhe “Adicionar ao ecrã inicial” ou “Instalar aplicação”.</p><button class="btn block mt" data-action="close">Fechar</button>';document.getElementById('modal').showModal();}}
 });
 document.addEventListener('submit',async e=>{
  const form=e.target;if(form.id!=='login'&&!form.dataset.extra)return;e.preventDefault();
  const button=form.querySelector('button'),status=form.querySelector('[role=status]'),input=form.elements.email;
  input.value=E.normalizarEmail(input.value);
  if(!E.emailValido(input.value)){status.textContent='Confere o e-mail introduzido.';input.setAttribute('aria-invalid','true');return;}
  input.removeAttribute('aria-invalid');button.disabled=true;status.textContent='A consultar…';
  try{
   if(form.dataset.extra){
    if(await E.liberarExtra(form.dataset.extra,input.value)){const route='#colecao/'+form.dataset.extra;if(location.hash===route)render();else location.hash=route;}
    else status.textContent='Não encontrámos essa compra neste e-mail. Confere o e-mail ou fala com o apoio.';
   }else{
    const grants=await E.login(input.value);
    if(grants.length){render();if(CONFIG.EXTRAS_EMAIL_LIVRE){const current=document.getElementById('login-status');if(current)current.textContent='Acesso disponível';}}
    else status.textContent='Nenhum acesso encontrado para este e-mail.';
   }
  }catch(err){status.textContent=err.message;}finally{button.disabled=false;}
 });
 addEventListener('hashchange',render);addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
 try{const entries=await Promise.all(['modelos','guirlandas','lacos'].map(async k=>{const r=await fetch('data/'+k+'.json');if(!r.ok)throw Error('Dados indisponíveis');return[k,await r.json()];}));data=Object.fromEntries(entries);
  // O modo livre usa o acesso salvo; o modo integrado revalida no servidor.
  if(E.get().email&&!CONFIG.EXTRAS_EMAIL_LIVRE){try{await E.login(E.get().email);}catch(_){if(!CONFIG.MODO_PROVISORIO){E.get().direitos=[];}}}
  render();
 }catch(_){app.innerHTML='<section class="card"><h1>Não foi possível carregar</h1><a class="btn mt" href="">Tenta novamente</a></section>';}
 if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
