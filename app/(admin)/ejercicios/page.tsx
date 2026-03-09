"use client";

import { useState, useEffect, useCallback } from "react";
import Logo from "@/components/Logo";

interface Ejercicio {
  id: string;
  name: string;
  description: string;
  videoUrl: string | null;
  createdAt: string;
}

type ModalMode = "create" | "edit" | "delete" | "view" | null;

export default function EjerciciosPage() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterNoVideo, setFilterNoVideo] = useState(false);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedEjercicio, setSelectedEjercicio] = useState<Ejercicio | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formError, setFormError] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEjercicios = useCallback(async () => {
    try {
      const res = await fetch("/api/ejercicios");
      const data = await res.json();
      if (res.ok) setEjercicios(data);
    } catch {
      showToast("Error al cargar ejercicios", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEjercicios();
  }, [fetchEjercicios]);

  // Filtered exercises
  const filtered = ejercicios.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVideo = filterNoVideo ? !e.videoUrl : true;
    return matchesSearch && matchesVideo;
  });

  // Modal helpers
  const openCreate = () => {
    setFormName("");
    setFormDescription("");
    setFormVideoUrl("");
    setFormError("");
    setSelectedEjercicio(null);
    setModalMode("create");
  };

  const openEdit = (ej: Ejercicio) => {
    setFormName(ej.name);
    setFormDescription(ej.description);
    setFormVideoUrl(ej.videoUrl || "");
    setFormError("");
    setSelectedEjercicio(ej);
    setModalMode("edit");
  };

  const openDelete = (ej: Ejercicio) => {
    setSelectedEjercicio(ej);
    setModalMode("delete");
  };

  const openView = (ej: Ejercicio) => {
    setSelectedEjercicio(ej);
    setModalMode("view");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedEjercicio(null);
    setFormError("");
  };

  // CRUD operations
  const handleSave = async () => {
    if (!formName.trim() || !formDescription.trim()) {
      setFormError("Nombre y descripción son obligatorios.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (modalMode === "create") {
        const res = await fetch("/api/ejercicios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            videoUrl: formVideoUrl.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error || "Error al crear");
          return;
        }
        showToast("Ejercicio creado exitosamente", "success");
      } else if (modalMode === "edit" && selectedEjercicio) {
        const res = await fetch(`/api/ejercicios/${selectedEjercicio.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            videoUrl: formVideoUrl.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error || "Error al actualizar");
          return;
        }
        showToast("Ejercicio actualizado", "success");
      }
      closeModal();
      fetchEjercicios();
    } catch {
      setFormError("Error de conexión con el servidor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEjercicio) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ejercicios/${selectedEjercicio.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        showToast("Error al eliminar el ejercicio", "error");
        return;
      }
      showToast("Ejercicio eliminado", "success");
      closeModal();
      fetchEjercicios();
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setFormError("El video es demasiado pesado (máx 100MB).");
      return;
    }

    setUploadingVideo(true);
    setFormError("");

    try {
      const sigRes = await fetch("/api/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "kineapp_ejercicios" }),
      });

      if (!sigRes.ok) throw new Error("Error obteniendo la firma de Cloudinary");

      const { timestamp, signature, cloudName, apiKey } = await sigRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", "kineapp_ejercicios");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadRes.ok) throw new Error("Error subiendo a Cloudinary");

      const uploadData = await uploadRes.json();
      setFormVideoUrl(uploadData.secure_url);
      showToast("Video subido con éxito", "success");
    } catch (err: any) {
      console.error(err);
      setFormError("Hubo un error al subir el video. Revisá tus credenciales.");
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="h-16 md:h-20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 bg-white/50 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4 w-full md:w-96">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary text-sm outline-none dark:text-white placeholder:text-slate-400"
              placeholder="Buscar ejercicio..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all ml-4"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span className="hidden sm:inline">Nuevo Ejercicio</span>
        </button>
      </header>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto w-full">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Ejercicios</h1>
          {/* <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gestioná la biblioteca de ejercicios. Actualmente hay{" "}
            <span className="text-primary font-bold">{ejercicios.length}</span> ejercicios registrados.
          </p> */}
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white dark:bg-card-dark p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 md:gap-4 hover:border-primary/50 transition-all">
            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-primary/10 rounded-xl text-primary flex-shrink-0">
              <span className="material-symbols-outlined text-xl md:text-2xl">fitness_center</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{ejercicios.length}</p>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Total Ejercicios</p>
            </div>
          </div>
          <button 
            onClick={() => setFilterNoVideo(!filterNoVideo)}
            className={`p-4 md:p-5 text-left rounded-xl border shadow-sm transition-all flex items-center gap-3 md:gap-4 flex-1 min-w-0 ${
              filterNoVideo
                ? "bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20"
                : "bg-white dark:bg-card-dark border-slate-200 dark:border-slate-800 hover:border-amber-500/50 group"
            }`}
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors ${filterNoVideo ? "bg-amber-500/20 text-amber-500" : "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20"}`}>
              <span className="material-symbols-outlined text-xl md:text-2xl">videocam_off</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">
                {ejercicios.filter((e) => !e.videoUrl).length}
              </p>
              <p className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 truncate">Sin Video</p>
            </div>
          </button>
        </div>

        {/* Exercise list / table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Logo animate className="w-12 h-12 text-primary mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando ejercicios...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-400">
                {searchQuery ? "search_off" : "fitness_center"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {searchQuery ? "Sin resultados" : "No hay ejercicios"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery
                ? `No se encontraron ejercicios para "${searchQuery}"`
                : "Empezá creando tu primer ejercicio"}
            </p>
            {!searchQuery && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 transition-all"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Crear Ejercicio
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white dark:bg-card-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Ejercicio</th>
                    <th className="px-6 py-4">Descripción</th>
                    <th className="px-6 py-4 text-center">Video</th>
                    <th className="px-6 py-4 text-center">Fecha</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filtered.map((ej) => (
                    <tr
                      key={ej.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined">fitness_center</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {ej.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {ej.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {ej.videoUrl ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full">
                            <span className="material-symbols-outlined text-xs">videocam</span>
                            Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-400 text-[10px] font-bold rounded-full">
                            <span className="material-symbols-outlined text-xs">videocam_off</span>
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(ej.createdAt).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openView(ej)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                            title="Ver"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden space-y-3">
              {filtered.map((ej) => (
                <div key={ej.id} className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-3 group">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined">fitness_center</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{ej.name}</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                          {new Date(ej.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => openView(ej)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg transition-all flex-shrink-0"><span className="material-symbols-outlined text-xl">visibility</span></button>
                  </div>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{ej.description}</p>
                  
                  <div className="flex items-center justify-between mt-1">
                    {ej.videoUrl ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">videocam</span> Con video
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[14px]">videocam_off</span> Sin video
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ===== MODAL ===== */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-card-dark w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/40 overflow-hidden animate-[slideUp_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Delete confirmation */}
            {modalMode === "delete" && selectedEjercicio && (
              <>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-red-500 text-3xl">delete_forever</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Eliminar Ejercicio
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                    ¿Estás seguro que querés eliminar
                  </p>
                  <p className="text-primary font-bold mb-4">&quot;{selectedEjercicio.name}&quot;</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
                <div className="flex gap-3 p-6 pt-0">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <Logo animate className="w-6 h-6 text-current" />
                    ) : (
                      <span className="material-symbols-outlined text-lg">delete</span>
                    )}
                    {saving ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </>
            )}

            {/* View */}
            {modalMode === "view" && selectedEjercicio && (
              <>
                <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">fitness_center</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedEjercicio.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(selectedEjercicio.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => { closeModal(); openEdit(selectedEjercicio); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Editar">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button onClick={() => { closeModal(); openDelete(selectedEjercicio); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Eliminar">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                    <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
                  {/* Description */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Descripción</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      {selectedEjercicio.description}
                    </p>
                  </div>

                  {/* Video Preview */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Video de demostración</h4>
                    {selectedEjercicio.videoUrl ? (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-black/5 dark:bg-white/5 flex items-center justify-center relative">
                        <video 
                          src={selectedEjercicio.videoUrl} 
                          controls 
                          className="w-full h-full max-h-[40vh] object-contain rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className="w-full py-8 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">videocam_off</span>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Este ejercicio no tiene video.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Create / Edit form */}
            {(modalMode === "create" || modalMode === "edit") && (
              <>
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">
                        {modalMode === "create" ? "add_circle" : "edit"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {modalMode === "create" ? "Nuevo Ejercicio" : "Editar Ejercicio"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {modalMode === "create"
                          ? "Agregá un ejercicio a la biblioteca"
                          : `Editando: ${selectedEjercicio?.name}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {formError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {formError}
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">
                      Nombre del Ejercicio
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">fitness_center</span>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ej: Rotación externa con banda"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">
                      Descripción
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describe el ejercicio, músculos involucrados, beneficios..."
                      rows={3}
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 focus:border-primary/50 outline-none transition-all dark:text-white placeholder:text-slate-400 resize-none"
                    />
                  </div>

                  {/* Video URL */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">
                      Video del Ejercicio <span className="text-slate-400 dark:text-slate-600 normal-case tracking-normal">(opcional)</span>
                    </label>
                    <div className="space-y-3">
                      {formVideoUrl ? (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-white/[0.03]">
                          <video 
                            src={formVideoUrl} 
                            controls 
                            className="w-full max-h-[200px] object-contain bg-black/5 dark:bg-black/20"
                          />
                          <button
                            type="button"
                            onClick={() => setFormVideoUrl("")}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            title="Quitar video"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ) : (
                        <label className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden ${
                          uploadingVideo 
                            ? "border-primary/50 bg-primary/5 cursor-wait" 
                            : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-white/[0.02] hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        }`}>
                          {uploadingVideo ? (
                            <div className="flex flex-col items-center text-primary">
                              <Logo animate className="w-8 h-8 text-current mb-2" />
                              <span className="text-xs font-bold">Subiendo video...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-slate-400 dark:text-slate-500">
                              <span className="material-symbols-outlined text-3xl mb-2">cloud_upload</span>
                              <span className="text-sm font-medium">Hacé click para seleccionar un video</span>
                              <span className="text-[10px] mt-1">MP4, WEBM, MOV (máx 100MB)</span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="video/*"
                            disabled={uploadingVideo}
                            onChange={handleVideoUpload}
                          />
                        </label>
                      )}
                      
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">link</span>
                        <input
                          type="url"
                          value={formVideoUrl}
                          onChange={(e) => setFormVideoUrl(e.target.value)}
                          placeholder="O pegá una URL web directamente..."
                          disabled={uploadingVideo}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/40 outline-none transition-all dark:text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-6 pt-2">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {saving ? (
                      <Logo animate className="w-5 h-5 text-current" />
                    ) : (
                      <span className="material-symbols-outlined text-lg">
                        {modalMode === "create" ? "add" : "save"}
                      </span>
                    )}
                    {saving
                      ? "Guardando..."
                      : modalMode === "create"
                      ? "Crear Ejercicio"
                      : "Guardar Cambios"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold shadow-2xl animate-[slideUp_0.3s_ease-out] ${
            toast.type === "success"
              ? "bg-emerald-500 text-white shadow-emerald-500/30"
              : "bg-red-500 text-white shadow-red-500/30"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.message}
        </div>
      )}

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
