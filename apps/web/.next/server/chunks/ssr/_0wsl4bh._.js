module.exports=[336273,a=>{"use strict";let b=(0,a.i(164831).default)("shield-check",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);a.s(["ShieldCheck",0,b],336273)},755681,777064,a=>{"use strict";var b=a.i(164831);let c=(0,b.default)("eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);a.s(["Eye",0,c],755681);let d=(0,b.default)("eye-off",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);a.s(["EyeOff",0,d],777064)},669710,a=>{"use strict";let b=(0,a.i(164831).default)("lock-keyhole",[["circle",{cx:"12",cy:"16",r:"1",key:"1au0dj"}],["rect",{x:"3",y:"10",width:"18",height:"12",rx:"2",key:"6s8ecr"}],["path",{d:"M7 10V7a5 5 0 0 1 10 0v3",key:"1pqi11"}]]);a.s(["LockKeyhole",0,b],669710)},448479,a=>{"use strict";var b=a.i(187924),c=a.i(238246),d=a.i(572131),e=a.i(935112),f=a.i(818783),g=a.i(755681),h=a.i(777064),i=a.i(669710),j=a.i(162591),k=a.i(336273);let l={success:!1},m=(0,d.memo)(function({children:a}){return(0,b.jsx)("div",{className:"group flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 transition duration-150 focus-within:border-slate-950 focus-within:shadow-[0_0_0_3px_rgba(15,23,42,0.10)] sm:min-h-12 sm:px-3.5",children:a})});a.s(["default",0,function({returnTo:a,loginAction:n}){let[o,p,q]=(0,d.useActionState)(n,l),[r,s]=(0,d.useState)(!1),t=o?.error??null,u=(0,d.useCallback)(()=>{s(a=>!a)},[]);return(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)("style",{children:`
        @keyframes loginSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .login-loading-ring {
          animation: loginSpin 0.85s linear infinite;
        }

        .login-loading-dot {
          width: 0.7rem;
          height: 0.7rem;
          border-radius: 9999px;
          animation-duration: 1.15s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .login-loading-dot--teal {
          background: #14b8a6;
          animation-name: loadingDotGlowTeal;
        }

        .login-loading-dot--violet {
          background: #8b5cf6;
          animation-name: loadingDotGlowViolet;
          animation-delay: 0.18s;
        }

        .login-loading-dot--amber {
          background: #f59e0b;
          animation-name: loadingDotGlowAmber;
          animation-delay: 0.36s;
        }

        @keyframes loadingDotGlowTeal {
          0%, 80%, 100% {
            transform: scale(0.7);
            opacity: 0.4;
            box-shadow: 0 0 0.15rem rgba(20, 184, 166, 0.2);
          }
          40% {
            transform: scale(1.15);
            opacity: 1;
            box-shadow:
              0 0 0.45rem rgba(20, 184, 166, 0.95),
              0 0 1rem rgba(45, 212, 191, 0.65),
              0 0 1.6rem rgba(20, 184, 166, 0.35);
          }
        }

        @keyframes loadingDotGlowViolet {
          0%, 80%, 100% {
            transform: scale(0.7);
            opacity: 0.4;
            box-shadow: 0 0 0.15rem rgba(139, 92, 246, 0.2);
          }
          40% {
            transform: scale(1.15);
            opacity: 1;
            box-shadow:
              0 0 0.45rem rgba(139, 92, 246, 0.95),
              0 0 1rem rgba(167, 139, 250, 0.65),
              0 0 1.6rem rgba(139, 92, 246, 0.35);
          }
        }

        @keyframes loadingDotGlowAmber {
          0%, 80%, 100% {
            transform: scale(0.7);
            opacity: 0.4;
            box-shadow: 0 0 0.15rem rgba(245, 158, 11, 0.2);
          }
          40% {
            transform: scale(1.15);
            opacity: 1;
            box-shadow:
              0 0 0.45rem rgba(245, 158, 11, 0.95),
              0 0 1rem rgba(251, 191, 36, 0.65),
              0 0 1.6rem rgba(245, 158, 11, 0.35);
          }
        }

        .login-auth-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          min-height: 100vh;
          min-height: 100dvh;
          place-items: center;
          background:
            radial-gradient(circle at center, rgba(255, 255, 255, 0.18), transparent 34%),
            rgba(15, 23, 42, 0.38);
          -webkit-backdrop-filter: blur(14px) saturate(1.08);
          backdrop-filter: blur(14px) saturate(1.08);
        }

        @media (max-height: 740px) {
          .login-form-compact {
            padding-top: 12px;
            padding-bottom: 12px;
          }

          .login-form-stack {
            gap: 12px;
          }

          .login-field-stack {
            gap: 6px;
          }

          .login-form-label {
            font-size: 13px;
          }

          .login-form-meta {
            margin-top: 12px;
            padding-top: 12px;
          }
        }

        @media (max-height: 660px) {
          .login-form-compact {
            padding-top: 10px;
            padding-bottom: 10px;
          }

          .login-form-stack {
            gap: 10px;
          }

          .login-form-meta {
            display: none;
          }
        }

        @media (max-height: 590px) {
          .login-form-label {
            display: none;
          }

          .login-form-stack {
            gap: 8px;
          }
        }
      `}),q&&"u">typeof document?(0,e.createPortal)((0,b.jsx)("div",{className:"login-auth-overlay px-5",children:(0,b.jsxs)("div",{className:"w-full max-w-[300px] rounded-2xl border border-white/80 bg-white/92 px-6 py-7 text-center shadow-[0_28px_90px_rgba(15,23,42,0.28)] ring-1 ring-slate-950/5 backdrop-blur-xl",children:[(0,b.jsx)("div",{className:"mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 shadow-[0_16px_36px_rgba(15,23,42,0.22)]",children:(0,b.jsx)("div",{className:"login-loading-ring h-9 w-9 rounded-full border-[3px] border-white/30 border-t-white"})}),(0,b.jsx)("h3",{className:"mt-5 text-lg font-semibold tracking-tight text-slate-950",children:"Verifying details"}),(0,b.jsx)("p",{className:"mt-1.5 text-sm leading-5 text-slate-600",children:"Please wait while we securely log you in."}),(0,b.jsxs)("div",{className:"mt-5 flex items-center justify-center gap-2.5","aria-hidden":"true",children:[(0,b.jsx)("span",{className:"login-loading-dot login-loading-dot--teal"}),(0,b.jsx)("span",{className:"login-loading-dot login-loading-dot--violet"}),(0,b.jsx)("span",{className:"login-loading-dot login-loading-dot--amber"})]})]})}),document.body):null,(0,b.jsxs)("div",{className:"px-5 py-6 sm:px-7",children:[(0,b.jsxs)("form",{action:p,className:"flex flex-col gap-4",children:[a?(0,b.jsx)("input",{type:"hidden",name:"returnTo",value:a}):null,(0,b.jsxs)("div",{className:"flex flex-col gap-2",children:[(0,b.jsx)("label",{htmlFor:"email",className:"text-sm font-medium text-slate-800",children:"Email or username"}),(0,b.jsxs)(m,{children:[(0,b.jsx)(j.Mail,{className:"h-4 w-4 shrink-0 text-slate-400 transition group-focus-within:text-slate-950"}),(0,b.jsx)("input",{id:"email",name:"email",type:"text",autoComplete:"username",placeholder:"you@company.com or landlord01",disabled:q,"aria-invalid":!!o.fieldErrors?.email?.length,className:"h-full w-full bg-transparent text-[16px] text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:text-[15px]"})]}),o.fieldErrors?.email?.length?(0,b.jsx)("p",{className:"text-xs font-medium text-red-600 sm:text-sm",children:o.fieldErrors.email[0]}):null]}),(0,b.jsxs)("div",{className:"flex flex-col gap-2",children:[(0,b.jsxs)("div",{className:"flex items-center justify-between gap-3",children:[(0,b.jsx)("label",{htmlFor:"password",className:"text-sm font-medium text-slate-800",children:"Password"}),(0,b.jsx)(c.default,{href:"/forgot-password",className:"text-xs font-semibold text-slate-950 underline-offset-4 transition hover:underline sm:text-sm",children:"Forgot password?"})]}),(0,b.jsxs)(m,{children:[(0,b.jsx)(i.LockKeyhole,{className:"h-4 w-4 shrink-0 text-slate-400 transition group-focus-within:text-slate-950"}),(0,b.jsx)("input",{id:"password",name:"password",type:r?"text":"password",autoComplete:"current-password",placeholder:"Enter your password",disabled:q,"aria-invalid":!!o.fieldErrors?.password?.length,className:"h-full w-full bg-transparent text-[16px] text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:text-[15px]"}),(0,b.jsxs)("button",{type:"button",onClick:u,disabled:q,className:"inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 transition active:scale-95 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50","aria-label":r?"Hide password":"View password","aria-pressed":r,children:[r?(0,b.jsx)(h.EyeOff,{className:"h-4 w-4 shrink-0","aria-hidden":"true"}):(0,b.jsx)(g.Eye,{className:"h-4 w-4 shrink-0","aria-hidden":"true"}),(0,b.jsx)("span",{className:"hidden min-[380px]:inline",children:r?"Hide password":"View password"}),(0,b.jsx)("span",{className:"min-[380px]:hidden",children:r?"Hide":"View"})]})]}),o.fieldErrors?.password?.length?(0,b.jsx)("p",{className:"text-xs font-medium text-red-600 sm:text-sm",children:o.fieldErrors.password[0]}):null]}),t?(0,b.jsx)("div",{role:"alert","aria-live":"assertive",className:"rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium leading-5 text-red-700 sm:px-4 sm:py-3 sm:text-sm",children:t}):null,(0,b.jsxs)("button",{type:"submit",disabled:q,className:"inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition duration-150 active:scale-[0.99] hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-12",children:[(0,b.jsx)("span",{children:q?"Verifying...":"Log in"}),q?null:(0,b.jsx)(f.ArrowRight,{className:"h-4 w-4"})]})]}),(0,b.jsx)("div",{className:"mt-5 border-t border-slate-200 pt-5",children:(0,b.jsxs)("div",{className:"flex items-center justify-between gap-3",children:[(0,b.jsxs)("p",{className:"text-sm text-slate-600",children:["Need an account?",(0,b.jsx)(c.default,{href:"/register",className:"ml-1.5 font-semibold text-slate-950 underline-offset-4 transition hover:underline",children:"Create one"})]}),(0,b.jsxs)("div",{className:"hidden items-center gap-1.5 text-xs text-slate-500 sm:inline-flex",children:[(0,b.jsx)(k.ShieldCheck,{className:"h-4 w-4 text-slate-700"}),"Protected"]})]})})]})]})}])}];

//# sourceMappingURL=_0wsl4bh._.js.map