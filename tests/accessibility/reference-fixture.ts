import type { Page } from '@playwright/test';

/** Local browser-harness reference surface, not a deployed Versatil product UI. */
export const referenceHTML = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Browser harness accessibility reference</title><style>
* { box-sizing: border-box } body { margin:0; font:16px Arial,sans-serif; color:#111; background:#fff }
header,main,footer { padding:20px; max-width:900px; margin:auto } nav { display:flex; flex-wrap:wrap; gap:16px }
a { color:#003c80 } button,input,select,textarea { font:inherit; padding:8px; border:2px solid #555; border-radius:2px }
button { color:#111; background:#eee } :focus { outline:3px solid #005fcc; outline-offset:3px }
label { display:block; margin-top:12px } input,textarea { width:100%; max-width:440px }
body.dark { color:#fff; background:#151515 } body.dark a { color:#9ecaff }
body.dark button { color:#fff; background:#333; border-color:#aaa } body.dark :focus { outline-color:#9ecaff }
[hidden] { display:none!important } dialog { color:#111; background:#fff; border:2px solid #555 }
#tooltip { padding:8px; border:1px solid #111 } [role=menu], [role=listbox] { padding:8px }
</style></head><body>
<header role="banner"><nav role="navigation" aria-label="Primary">
<a id="skip" href="#main">Skip to content</a><a id="contact-link" href="/contact">Contact</a>
<button id="activate" type="button">Activate</button><button id="open-dialog" type="button" aria-haspopup="dialog">Open dialog</button>
<button id="theme" type="button" aria-label="Toggle theme" data-testid="theme-toggle">Toggle theme</button>
</nav></header>
<main id="main" role="main" tabindex="-1"><h1>Browser harness reference</h1><p>This fixture validates the test infrastructure.</p>
<output id="activation" aria-live="polite">0</output>
<section aria-labelledby="interaction-title"><h2 id="interaction-title">Keyboard controls</h2>
<label for="choice">Choice</label><select id="choice" size="2"><option value="one" selected>One</option><option value="two">Two</option></select>
<button id="menu-trigger" type="button" aria-haspopup="menu" aria-expanded="false">Actions</button>
<div id="menu" role="menu" aria-label="Actions" hidden><button id="menu-one" type="button" role="menuitem" tabindex="-1">First action</button><button id="menu-two" type="button" role="menuitem" tabindex="-1">Second action</button></div>
<div role="listbox" aria-label="Options"><div id="option-one" role="option" aria-selected="true" tabindex="0">First option</div><div id="option-two" role="option" aria-selected="false" tabindex="-1">Second option</div></div>
<button id="tooltip-trigger" type="button" aria-describedby="tooltip">Help</button><div id="tooltip" role="tooltip" hidden>Reference help</div>
</section><section aria-labelledby="form-title"><h2 id="form-title">Contact form</h2>
<form id="contact-form" data-component="contact-form">
<label for="name">Name</label><input id="name" name="name" type="text" aria-label="Name" required>
<label for="email">Email</label><input id="email" name="email" type="email" aria-label="Email" required>
<label for="password">Password</label><input id="password" type="password" aria-label="Password">
<label for="number">Number</label><input id="number" type="number" aria-label="Number">
<label for="tel">Telephone</label><input id="tel" type="tel" aria-label="Telephone">
<label for="message">Message</label><textarea id="message" name="message" aria-label="Message" required></textarea>
<button type="submit">Submit</button></form><p role="status" data-testid="success-message" hidden>Message received in reference fixture.</p>
</section><section aria-labelledby="variants"><h2 id="variants">Button variants</h2>
<button type="button" data-variant="primary">Primary</button><button type="button" data-variant="secondary">Secondary</button><button type="button" data-variant="outline">Outline</button><button type="button" data-variant="ghost">Ghost</button>
</section></main><footer role="contentinfo">Reference fixture only</footer>
<dialog id="dialog" aria-labelledby="dialog-title"><h2 id="dialog-title">Reference dialog</h2><input id="dialog-input" aria-label="Dialog value"><button id="close-dialog" type="button">Close dialog</button></dialog>
<script>
const byId = id => document.getElementById(id);
let activations=0; byId('activate').onclick=()=>{byId('activation').textContent=String(++activations)};
byId('theme').onclick=()=>document.body.classList.toggle('dark');
byId('open-dialog').onclick=()=>{byId('dialog').showModal();byId('dialog-input').focus()};
byId('close-dialog').onclick=()=>byId('dialog').close();
byId('dialog').onclose=()=>byId('open-dialog').focus();
byId('menu-trigger').onclick=()=>{byId('menu').hidden=false;byId('menu-trigger').setAttribute('aria-expanded','true');byId('menu-one').focus()};
byId('menu').onkeydown=e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();(document.activeElement.id==='menu-one'?byId('menu-two'):byId('menu-one')).focus()}};
byId('option-one').onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();byId('option-one').setAttribute('aria-selected','false');byId('option-two').setAttribute('aria-selected','true');byId('option-two').focus()}};
byId('tooltip-trigger').onmouseenter=()=>{byId('tooltip').hidden=false};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){byId('tooltip').hidden=true;if(!byId('menu').hidden){byId('menu').hidden=true;byId('menu-trigger').setAttribute('aria-expanded','false');byId('menu-trigger').focus()}}});
byId('contact-form').onsubmit=e=>{e.preventDefault();document.querySelector('[data-testid="success-message"]').hidden=false};
</script></body></html>`;

export async function installReferenceFixture(page: Page): Promise<void> {
  await page.route('http://localhost:3000/**', route => route.fulfill({
    status: 200, contentType: 'text/html', body: referenceHTML
  }));
}
