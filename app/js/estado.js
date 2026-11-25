window.Estado = (() => {
  let state = {email:'', direitos:[], provisoria:null, extras:[], favoritos:[], feitos:[]};
  try { Object.assign(state, JSON.parse(localStorage.getItem(CONFIG.STORAGE) || '{}')); } catch (_) {}
  const save = () => { try { localStorage.setItem(CONFIG.STORAGE,JSON.stringify(state)); } catch (_) {} };
  const q = new URLSearchParams(location.search);
  if (CONFIG.MODO_PROVISORIO) {
    if (['basico','premium'].includes(q.get('plano'))) state.provisoria=q.get('plano');
    if(q.has('extras')) state.extras=(q.get('extras')||'').split(',').filter(x=>['guirlandas','lacos'].includes(x));
    save();
  }
  function direitos(){return [...new Set([...state.direitos,...(CONFIG.MODO_PROVISORIO?[state.provisoria,...state.extras]:[])])];}
  return { get:()=>state, direitos, tem:x=>direitos().includes(x), premium:()=>direitos().includes('premium'),
    acesso:()=>direitos().some(x=>['basico','premium','guirlandas','lacos'].includes(x)),
    async login(email){
      email=email.trim().toLowerCase();
      const response=await fetch(CONFIG.ACESSO_URL+'?email='+encodeURIComponent(email),{cache:'no-store'});
      if(!response.ok) throw new Error('Não foi possível consultar o acesso. Tente novamente.');
      const result=await response.json();
      state.email=email;state.direitos=(result.direitos||[]).filter(x=>['basico','premium','guirlandas','lacos'].includes(x));save();
      return state.direitos;
    },
    toggle(key,id){const a=state[key]; const n=a.indexOf(id); if(n<0)a.push(id);else a.splice(n,1);save();},
    sair(){state.email='';state.direitos=[];state.provisoria=null;state.extras=[];save();},
    checkout(key){const value=CONFIG.ADDONS[key].checkout;if(value.startsWith('#'))return value;const url=new URL(value,location.href);if(state.email)url.searchParams.set('email',state.email);return url.href;}
  };
})();
