import{e as i}from"./index-B53fFBlg.js";/**
 * @license lucide-react v1.39.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],u=i("download",h);function m(a,t){if(t.length===0)return;const o=Object.keys(t[0]),s=[o.join(","),...t.map(l=>o.map(d=>{const c=l[d],e=c==null?"":String(c);return e.includes(",")||e.includes('"')||e.includes(`
`)?`"${e.replace(/"/g,'""')}"`:e}).join(","))].join(`
`),r=new Blob([s],{type:"text/csv;charset=utf-8;"}),n=document.createElement("a");n.href=URL.createObjectURL(r),n.download=a,n.click(),URL.revokeObjectURL(n.href)}export{u as D,m as e};
