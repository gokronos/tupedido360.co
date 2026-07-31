"use client";

import { Eye, ImagePlus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ImageUpload } from "@/components/image-upload";

type Template = "classic" | "catalog" | "impact";
type Banner = { id?: string; eyebrow: string; title: string; description: string; imageUrl: string; active: boolean; sortOrder: number };
const templateOptions: Array<{id:Template;name:string;description:string}> = [
  { id:"classic", name:"Clásico", description:"Fotos amplias y tarjetas equilibradas." },
  { id:"catalog", name:"Catálogo", description:"Lista compacta para menús extensos." },
  { id:"impact", name:"Impacto", description:"Imágenes protagonistas y mayor presencia visual." },
];
const emptyBanner = (sortOrder:number):Banner => ({ eyebrow:"RECOMENDADO", title:"Título del banner", description:"Cuéntales a tus clientes qué hace especial esta opción.", imageUrl:"", active:true, sortOrder });

export function DesignManager({ slug }:{slug:string}) {
  const [template,setTemplate]=useState<Template>("classic");
  const [banners,setBanners]=useState<Banner[]>([]);
  const [editing,setEditing]=useState<Banner|null>(null);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const load=useCallback(async()=>{const response=await fetch("/api/design",{cache:"no-store"});const result=await response.json();if(response.ok){setTemplate(result.menuTemplate);setBanners(result.banners)}else setMessage(result.error)},[]);
  useEffect(()=>{const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer)},[load]);
  async function action(payload:Record<string,unknown>,success:string){setSaving(true);setMessage("");const response=await fetch("/api/design",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const result=await response.json();setMessage(response.ok?success:result.error);if(response.ok)await load();setSaving(false);return response.ok}
  async function choose(next:Template){setTemplate(next);await action({action:"setTemplate",template:next},"Diseño aplicado al menú público.")}
  async function save(){if(!editing)return;if(await action({action:"saveBanner",...editing},"Banner guardado correctamente."))setEditing(null)}
  async function remove(id?:string){if(!id)return;if(await action({action:"deleteBanner",id},"Banner eliminado."))setEditing(null)}
  return <div className="design-manager">
    <div className="panel-section-title"><div><h2>Diseño del menú</h2><p>Elige cómo verán tus productos los clientes.</p></div><a href={`https://${slug}.tupedido360.co`} target="_blank" rel="noreferrer">Ver menú <Eye size={16}/></a></div>
    {message&&<p className="design-message">{message}</p>}
    <div className="template-grid">{templateOptions.map(option=><button className={template===option.id?"active":""} onClick={()=>void choose(option.id)} disabled={saving} key={option.id}><TemplatePreview type={option.id}/><span><strong>{option.name}</strong><small>{option.description}</small></span>{template===option.id&&<b>En uso</b>}</button>)}</div>
    <div className="banner-heading"><div><h2>Slider principal</h2><p>Publica promociones, novedades o productos destacados.</p></div><button onClick={()=>setEditing(emptyBanner(banners.length))}><ImagePlus size={18}/>Agregar banner</button></div>
    {banners.length?<div className="banner-list">{banners.map((banner,index)=><article key={banner.id}><div className="banner-thumb" style={banner.imageUrl?{backgroundImage:`url(${banner.imageUrl})`}:undefined}>{!banner.imageUrl&&<ImagePlus size={28}/>}</div><div><small>BANNER {index+1}{!banner.active?" · OCULTO":""}</small><strong>{banner.title}</strong><span>{banner.description||"Sin descripción"}</span></div><button onClick={()=>setEditing(banner)}>Editar</button></article>)}</div>:<div className="banner-empty"><ImagePlus size={32}/><h3>Tu menú todavía no tiene slider</h3><p>Agrega el primer banner para destacar lo mejor de tu negocio.</p><button onClick={()=>setEditing(emptyBanner(0))}>Crear primer banner</button></div>}
    {editing&&<div className="editor-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setEditing(null)}}><section className="banner-editor-modal"><header><div><h2>{editing.id?"Editar banner":"Nuevo banner"}</h2><p>Se mostrará en la parte superior del menú.</p></div><button className="editor-close" onClick={()=>setEditing(null)} aria-label="Cerrar">×</button></header><ImageUpload label="Imagen del banner" value={editing.imageUrl} onChange={imageUrl=>setEditing({...editing,imageUrl})}/><div className="field-row"><label><span>Texto superior</span><input value={editing.eyebrow} maxLength={50} onChange={event=>setEditing({...editing,eyebrow:event.target.value})}/></label><label><span>Orden</span><input type="number" min="0" value={editing.sortOrder} onChange={event=>setEditing({...editing,sortOrder:Number(event.target.value)})}/></label></div><label><span>Título</span><input value={editing.title} required minLength={3} maxLength={120} onChange={event=>setEditing({...editing,title:event.target.value})}/></label><label><span>Descripción</span><textarea rows={3} value={editing.description} maxLength={280} onChange={event=>setEditing({...editing,description:event.target.value})}/></label><label className="banner-active"><input type="checkbox" checked={editing.active} onChange={event=>setEditing({...editing,active:event.target.checked})}/><span>Mostrar este banner en el menú</span></label><footer>{editing.id&&<button className="danger-action" disabled={saving} onClick={()=>void remove(editing.id)}><Trash2 size={17}/>Eliminar</button>}<button className="primary-compact" disabled={saving} onClick={()=>void save()}><Save size={17}/>{saving?"Guardando...":"Guardar banner"}</button></footer></section></div>}
  </div>;
}

function TemplatePreview({type}:{type:Template}){return <div className={`template-preview ${type}`}><i/><div><span/><span/><span/></div><section><b/><b/><b/></section></div>}
