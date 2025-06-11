'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageUtils';
import { getWeek } from 'date-fns';

interface RevisionData {
  id?: string;
  created_at: string;
  casita: string;
  quien_revisa: string;
  caja_fuerte: string;
  puertas_ventanas: string;
  chromecast: string;
  binoculares: string;
  trapo_binoculares: string;
  speaker: string;
  usb_speaker: string;
  controles_tv: string;
  secadora: string;
  accesorios_secadora: string;
  accesorios_secadora_faltante: string;
  faltantes: string;
  steamer: string;
  bolsa_vapor: string;
  plancha_cabello: string;
  bulto: string;
  sombrero: string;
  bolso_yute: string;
  evidencia_01: string;
  evidencia_02: string;
  evidencia_03: string;
  fecha_edicion: string;
  quien_edito: string;
  datos_anteriores: any;
  datos_actuales: any;
  fecha_creacion: string;
  camas_ordenadas: string;
  cola_caballo: string;
  Notas: string;
}

interface Nota {
  id: string;
  fecha: string;
  Casita: string;
  nota: string;
  Evidencia: string;
  Usuario: string;
  created_at: string;
}

export default function DetallesRevision() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<RevisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [showNotaForm, setShowNotaForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nuevaNota, setNuevaNota] = useState({
    fecha: new Date().toISOString().split('T')[0],
    Usuario: '',
    nota: '',
    evidencia: null as File | null,
  });

  const nombresRevisores = [
    'Ricardo B', 'Michael J', 'Ramiro Q', 'Adrian S', 'Esteban B',
    'Willy G', 'Juan M', 'Olman Z', 'Daniel V', 'Jefferson V',
    'Cristopher G', 'Emerson S', 'Joseph R'
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: revisionData, error: revisionError } = await supabase
        .from('revisiones_casitas')
        .select('*')
        .eq('id', params.id)
        .single();

      if (revisionError) throw revisionError;
      setData(revisionData);

      // Obtener notas asociadas a esta casita
      const { data: notasData, error: notasError } = await supabase
        .from('Notas')
        .select('*')
        .eq('Casita', revisionData.casita)
        .order('id', { ascending: false });

      if (notasError) throw notasError;
      setNotas(notasData || []);
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const handleSubmitNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    
    try {
      setIsSubmitting(true);
      let evidenciaUrl = null;

      if (nuevaNota.evidencia) {
        const compressedImage = await compressImage(nuevaNota.evidencia);
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const week = `semana_${getWeek(now, { weekStartsOn: 1 })}`;
        const folder = `notas/${month}/${week}`;
        
        const formDataCloudinary = new FormData();
        formDataCloudinary.append('file', compressedImage);
        formDataCloudinary.append('upload_preset', 'PruebaSubir');
        formDataCloudinary.append('cloud_name', 'dhd61lan4');
        formDataCloudinary.append('folder', folder);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dhd61lan4/image/upload`,
          {
            method: 'POST',
            body: formDataCloudinary,
          }
        );

        if (!response.ok) {
          throw new Error('Error al subir la imagen a Cloudinary');
        }

        const data = await response.json();
        evidenciaUrl = data.secure_url;
      }

      // Obtener fecha y hora local del dispositivo
      const now = new Date();
      const fechaLocal = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      
      const { error } = await supabase
        .from('Notas')
        .insert([
          {
            fecha: fechaLocal.toISOString(),
            Casita: data.casita,
            Usuario: nuevaNota.Usuario,
            nota: nuevaNota.nota,
            Evidencia: evidenciaUrl
          }
        ]);

      if (error) throw error;

      setNuevaNota({
        fecha: new Date().toISOString().split('T')[0],
        Usuario: '',
        nota: '',
        evidencia: null
      });
      setShowNotaForm(false);
      fetchData();
    } catch (error: any) {
      console.error('Error al guardar la nota:', error);
      alert('Error al guardar la nota');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = (imgUrl: string) => {
    setModalImg(imgUrl);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalImg(null);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLImageElement>) => {
    e.preventDefault();
    setZoom(z => Math.max(0.2, Math.min(5, z + (e.deltaY < 0 ? 0.1 : -0.1))));
  };

  const handleMouseDownImage = (e: React.MouseEvent<HTMLImageElement>) => {
    if (zoom > 1 && e.button === 2) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMoveImage = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isDragging && zoom > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUpImage = (e: React.MouseEvent<HTMLImageElement>) => {
    if (e.button === 2) {
      setIsDragging(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLImageElement>) => {
    if (zoom > 1) {
      e.preventDefault();
    }
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-[#1a1f35] to-[#2d364c] flex items-center justify-center text-white">Cargando...</div>;
  if (error) return <div className="min-h-screen bg-gradient-to-br from-[#1a1f35] to-[#2d364c] flex items-center justify-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="min-h-screen bg-gradient-to-br from-[#1a1f35] to-[#2d364c] flex items-center justify-center text-white">No se encontraron datos</div>;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a1f35] to-[#2d364c]">
      {/* Modal de imagen */}
      {modalOpen && modalImg && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-[90vw] h-[90vh]">
            <img
              src={modalImg}
              alt="Evidencia"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[#1e2538] rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Detalles de la Revisión</h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-[#1a1f35] bg-gradient-to-br from-[#c9a45c] via-[#d4b06c] to-[#f0c987] rounded-xl hover:from-[#d4b06c] hover:via-[#e0bc7c] hover:to-[#f7d498] transform hover:scale-[1.02] transition-all duration-200 shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000 after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/20 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300 border border-[#f0c987]/20 hover:border-[#f0c987]/40 min-w-[100px] whitespace-nowrap"
            >
              Volver
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl text-[#c9a45c] font-semibold mb-4">Información General</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-base md:text-lg text-gray-300">
                    <span className="text-gray-400">Fecha:</span>{' '}
                    {data.created_at.split('.')[0].replace('T', ' ')}
                  </p>
                  <p className="text-base md:text-lg text-gray-300">
                    <span className="text-gray-400">Revisado por:</span> {data.quien_revisa}
                  </p>
                  <p className="text-base md:text-lg text-gray-300">
                    <span className="text-gray-400">Caja fuerte:</span> {data.caja_fuerte}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl text-[#c9a45c] font-semibold mb-4">Accesorios</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Caja Fuerte</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.caja_fuerte}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Puertas y Ventanas</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.puertas_ventanas}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Chromecast</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.chromecast}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Binoculares</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.binoculares}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Trapo Binoculares</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.trapo_binoculares}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Speaker</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.speaker}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">USB Speaker</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.usb_speaker}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Controles TV</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.controles_tv}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Secadora</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.secadora}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Accesorios Secadora</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.accesorios_secadora}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Accesorios Secadora Faltante</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.accesorios_secadora_faltante}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Faltantes</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.faltantes}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Steamer</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.steamer}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Bolsa Vapor</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.bolsa_vapor}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Plancha Cabello</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.plancha_cabello}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Bulto</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.bulto}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Sombrero</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.sombrero}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Bolso Yute</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.bolso_yute}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Camas Ordenadas</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.camas_ordenadas}</p>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl text-[#ff8c42] font-semibold mb-3">Cola Caballo</h3>
                  <p className="text-base md:text-lg text-gray-300">{data.cola_caballo}</p>
                </div>
              </div>
            </div>

            {(data.evidencia_01 || data.evidencia_02 || data.evidencia_03) && (
              <div>
                <h2 className="text-[#c9a45c] font-semibold mb-4">Evidencias</h2>
                <div className="bg-[#2a3347] rounded p-4">
                  <div className="flex gap-4">
                    {data.evidencia_01 && (
                      <button
                        onClick={() => openModal(data.evidencia_01)}
                        className="bg-[#c9a45c] text-white px-4 py-2 rounded hover:bg-[#d4b06c] transition"
                      >
                        Ver Evidencia 1
                      </button>
                    )}
                    {data.evidencia_02 && (
                      <button
                        onClick={() => openModal(data.evidencia_02)}
                        className="bg-[#c9a45c] text-white px-4 py-2 rounded hover:bg-[#d4b06c] transition"
                      >
                        Ver Evidencia 2
                      </button>
                    )}
                    {data.evidencia_03 && (
                      <button
                        onClick={() => openModal(data.evidencia_03)}
                        className="bg-[#c9a45c] text-white px-4 py-2 rounded hover:bg-[#d4b06c] transition"
                      >
                        Ver Evidencia 3
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[#ff4d4d] font-semibold">Notas</h2>
                <button
                  onClick={() => setShowNotaForm(true)}
                  className="px-4 py-2 bg-[#ff4d4d] text-white rounded-lg hover:bg-[#ff6b6b] transition-all transform hover:scale-[1.02] shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden border-2 border-white/40 hover:border-white/60 animate-shimmer-mobile md:animate-none"
                >
                  + Agregar Nota
                </button>
              </div>

              {showNotaForm && (
                <div className="bg-[#1e2538] rounded-lg p-4 mb-4">
                  <form onSubmit={handleSubmitNota} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Usuario</label>
                      <select
                        required
                        className="w-full px-4 py-2 bg-[#2a3347] border border-[#3d4659] rounded-md text-white"
                        value={nuevaNota.Usuario}
                        onChange={(e) => setNuevaNota({ ...nuevaNota, Usuario: e.target.value })}
                      >
                        <option value="">Seleccionar usuario</option>
                        {nombresRevisores.map(nombre => (
                          <option key={nombre} value={nombre}>{nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Nota</label>
                      <textarea
                        required
                        className="w-full px-4 py-2 bg-[#2a3347] border border-[#3d4659] rounded-md text-white"
                        rows={3}
                        value={nuevaNota.nota}
                        onChange={(e) => setNuevaNota({ ...nuevaNota, nota: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Evidencia</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#c9a45c]/20 file:text-[#c9a45c] hover:file:bg-[#c9a45c]/30"
                        onChange={(e) => setNuevaNota({ ...nuevaNota, evidencia: e.target.files?.[0] || null })}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNotaForm(false)}
                        className="px-4 py-2 bg-[#3d4659] text-gray-300 rounded-lg hover:bg-[#4a5568] transition-all transform hover:scale-[1.02] shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden border border-[#4a5568]/20 hover:border-[#4a5568]/40 animate-shimmer-mobile md:animate-none"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-4 py-2 text-sm font-medium text-[#1a1f35] ${isSubmitting ? 'bg-[#22c55e] hover:bg-[#22c55e]' : 'bg-[#f0c987] hover:bg-[#f7d498]'} rounded-xl transition-all transform hover:scale-[1.02] shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden border-2 border-white/40 hover:border-white/60 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px] animate-shimmer-mobile md:animate-none`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-[#1a1f35]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Guardar Nota</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {notas.map((nota) => (
                  <div key={nota.id} className="bg-[#1e2538] rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[#ff4d4d] font-medium">
                          {nota.fecha.split('.')[0].replace('T', ' ')}
                        </p>
                        <p className="text-gray-400 text-sm">Por: {nota.Usuario}</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-2">{nota.nota}</p>
                    {nota.Evidencia && (
                      <button
                        onClick={() => openModal(nota.Evidencia)}
                        className="text-[#ff4d4d] hover:text-[#ff6b6b] transition-colors"
                      >
                        Ver evidencia
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 