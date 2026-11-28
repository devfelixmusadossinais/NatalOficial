window.Estado = (() => {
  let state = {email:'', direitos:[], provisoria:null, extras:[], favoritos:[], feitos:[]};
  try { Object.assign(state, JSON.parse(localStorage.getItem(CONFIG.STORAGE) || '{}')); } catch (_) {}
  const save = () => { try { localStorage.setItem(CONFIG.STORAGE,JSON.stringify(state)); } catch (_) {} };
  const q = new URLSearchParams(location.search);
  if (CONFIG.MODO_PROVISORIO) {
    if (['basico','premium'].includes(q.get('plano'))) state.provisoria=q.get('plano');
    else if (!['basico','premium'].includes(state.provisoria) && !state.direitos.some(x=>['basico','premium'].includes(x))) state.provisoria='premium';
    save();
  }
  if(q.get('extras')==='none'){state.extras=[];state.direitos=state.direitos.filter(x=>!['guirlandas','lacos'].includes(x));save();}
  const normalizarEmail=email=>String(email||'').replace(/\s/g,'').toLowerCase();
  const emailValido=email=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizarEmail(email));
  function direitos(){const plano=CONFIG.MODO_PROVISORIO&&['basico','premium'].includes(state.provisoria)?state.provisoria:null;return [...new Set([...state.direitos.filter(x=>!plano||!['basico','premium'].includes(x)),...(plano?[plano]:[]),...(CONFIG.EXTRAS_EMAIL_LIVRE?state.extras:[])])];}
  return { get:()=>state, normalizarEmail, emailValido, direitos, tem:x=>direitos().includes(x), premium:()=>direitos().includes('premium'),
    acesso:()=>direitos().some(x=>['basico','premium','guirlandas','lacos'].includes(x)),
    async login(email){
      email=normalizarEmail(email);
      if(!emailValido(email))throw new Error('Confere o e-mail introduzido.');
      if(CONFIG.EXTRAS_EMAIL_LIVRE){
        state.email=email;state.extras=['guirlandas','lacos'];
        if(!direitos().some(x=>['basico','premium'].includes(x)))state.direitos.push('premium');
        save();return direitos();
      }
      const response=await fetch(CONFIG.ACESSO_URL+'?email='+encodeURIComponent(email),{cache:'no-store'});
      if(!response.ok) throw new Error('Não foi possível consultar o acesso. Tenta novamente.');
      const result=await response.json();
      state.email=email;state.direitos=(result.direitos||[]).filter(x=>['basico','premium','guirlandas','lacos'].includes(x));save();
      return state.direitos;
    },
    async liberarExtra(key,email){
      if(!['guirlandas','lacos'].includes(key))return false;
      email=normalizarEmail(email);
      if(!emailValido(email))throw new Error('Confere o e-mail introduzido.');
      if(!CONFIG.EXTRAS_EMAIL_LIVRE){
        const grants=await this.login(email);
        state.extras=grants.filter(x=>['guirlandas','lacos'].includes(x));save();
        return grants.includes(key);
      }
      state.email=email;state.extras=[...new Set([...state.extras,key])];save();return true;
    },
    toggle(key,id){const a=state[key]; const n=a.indexOf(id); if(n<0)a.push(id);else a.splice(n,1);save();},
    sair(){state.email='';state.direitos=[];state.provisoria=null;state.extras=[];save();},
    checkout(key){const value=CONFIG.ADDONS[key].checkout;if(value.startsWith('#'))return value;const url=new URL(value,location.href);if(state.email)url.searchParams.set('email',state.email);return url.href;}
  };
})();
