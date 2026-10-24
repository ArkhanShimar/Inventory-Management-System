// A keyboard-operated combobox layered over a real select, preserving form values.
let opened=null,serial=0;
export function enhanceDropdowns(root,{translate=(s=>s)}={}){
 for(const select of root.querySelectorAll('select:not([data-enhanced])')){
  select.dataset.enhanced='true';select.classList.add('select-source');select.tabIndex=-1;select.setAttribute('aria-hidden','true');
  const wrapper=document.createElement('div');wrapper.className='select-control';
  select.parentNode.insertBefore(wrapper,select);wrapper.append(select);
  const trigger=document.createElement('button');trigger.type='button';trigger.className='select-trigger';trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
  const label=select.getAttribute('aria-label')||select.closest('label')?.childNodes[0]?.textContent?.trim()||translate('Select an option');
  trigger.setAttribute('aria-label',label);trigger.disabled=select.disabled;
  const text=document.createElement('span');text.className='select-value';text.translate=false;trigger.append(text);
  const chevron=document.createElementNS('http://www.w3.org/2000/svg','svg');chevron.setAttribute('viewBox','0 0 16 16');chevron.setAttribute('aria-hidden','true');chevron.innerHTML='<path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';trigger.append(chevron);wrapper.append(trigger);
   const update=()=>{text.textContent=select.selectedOptions[0]?.textContent||translate('Select an option');trigger.title=text.textContent};update();select.addEventListener('change',update);
  function open(){
   if(opened?.trigger===trigger){opened.close();return}opened?.close(false);
   const panel=document.createElement('div');panel.className='select-popover';panel.id='select-list-'+(++serial);
   const list=document.createElement('div');list.className='select-options';list.setAttribute('role','listbox');list.setAttribute('aria-label',label);list.id=panel.id+'-options';trigger.setAttribute('aria-controls',list.id);
   let search=null,active=-1,options=[];
   if(select.options.length>6){search=document.createElement('input');search.className='select-search';search.placeholder=translate('Search options…');search.setAttribute('aria-label',translate('Search options…'));search.autocomplete='off';panel.append(search)}
   panel.append(list);document.body.append(panel);trigger.setAttribute('aria-expanded','true');
   const position=()=>{const rect=trigger.getBoundingClientRect();const width=Math.min(Math.max(rect.width,select.id==='language'||select.id==='login-language'?180:240),innerWidth-24);const below=innerHeight-rect.bottom-12,above=rect.top-12;const up=below<180&&above>below;panel.style.width=width+'px';panel.style.left=Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px';panel.style.maxHeight=Math.max(120,Math.min(340,up?above:below))+'px';if(up){panel.style.bottom=(innerHeight-rect.top+6)+'px';panel.style.top='auto'}else{panel.style.top=(rect.bottom+6)+'px';panel.style.bottom='auto'}};
   const close=(focus=true)=>{panel.remove();trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',keyboard,true);window.removeEventListener('resize',position);window.removeEventListener('scroll',scroll,true);opened=null;if(focus&&trigger.isConnected)trigger.focus()};
   const activate=index=>{if(!options.length)return;active=(index+options.length)%options.length;options.forEach((o,i)=>o.classList.toggle('is-active',i===active));trigger.setAttribute('aria-activedescendant',options[active].id);search?.setAttribute('aria-activedescendant',options[active].id);options[active].scrollIntoView({block:'nearest'})};
   const choose=option=>{select.value=option.value;update();close();select.dispatchEvent(new Event('change',{bubbles:true}))};
   function draw(){list.replaceChildren();const filter=search?.value.toLocaleLowerCase()||'';options=[];for(const option of select.options){if(option.disabled||option.hidden||!option.textContent.toLocaleLowerCase().includes(filter))continue;const button=document.createElement('button');button.type='button';button.className='select-option';button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.id=panel.id+'-'+options.length;button.tabIndex=-1;const title=document.createElement('span');title.textContent=option.textContent;title.translate=false;button.append(title);const selected=document.createElement('span');selected.className='select-check';selected.textContent=option.selected?'✓':'';selected.setAttribute('aria-hidden','true');button.append(selected);button.onclick=()=>choose(option);button.onpointermove=()=>activate(options.indexOf(button));list.append(button);options.push(button)}if(!options.length){const empty=document.createElement('p');empty.className='select-empty';empty.textContent=translate('No matching options');list.append(empty)}active=options.findIndex(o=>o.getAttribute('aria-selected')==='true');activate(active<0?0:active)}
   function keyboard(event){if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return}if(event.key==='Tab'){close();return}if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();event.stopPropagation();activate(active+(event.key==='ArrowDown'?1:-1))}else if(event.key==='Home'&&!search){event.preventDefault();activate(0)}else if(event.key==='End'&&!search){event.preventDefault();activate(options.length-1)}else if(event.key==='Enter'||(event.key===' '&&event.target!==search)){event.preventDefault();event.stopPropagation();options[active]?.click()}else if(!search&&event.key.length===1){const idx=options.findIndex(o=>o.textContent.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));if(idx>=0)activate(idx)}}
   function outside(event){if(!panel.contains(event.target)&&!wrapper.contains(event.target))close(false)}
   function scroll(event){if(!panel.contains(event.target))position()}
   opened={trigger,close};document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',keyboard,true);window.addEventListener('resize',position);window.addEventListener('scroll',scroll,true);if(search)search.oninput=draw;draw();position();(search||trigger).focus();
  }
  trigger.onclick=open;trigger.onkeydown=event=>{if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)&&!opened){event.preventDefault();open()}};
 }
}
export function closeDropdown(){opened?.close(false)}

