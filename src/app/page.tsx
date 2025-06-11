'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import NotasForm from '@/components/NotasForm';
import Link from 'next/link';

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

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState<RevisionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cajaFuerteFilter, setCajaFuerteFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const cajaFuerteOptions = [
    'Si', 'No', 'Check in', 'Check out', 'Upsell', 'Guardar Upsell', 'Back to Back', 'Show Room'
  ];

  const [showNotasForm, setShowNotasForm] = useState(false);

  useEffect(() => {
    fetchRevisiones();
  }, []);

  const fetchRevisiones = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching data from Supabase...');
      
      const { data: revisiones, error } = await supabase
        .from('revisiones_casitas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Data received:', revisiones);
      setData(revisiones || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(row => {
    const searchLower = searchTerm.toLowerCase();
    
    const cajaFuerteMatch = !cajaFuerteFilter || row.caja_fuerte === cajaFuerteFilter;

    if (!searchTerm) {
      return cajaFuerteMatch;
    }
    
    const searchMatch = 
      row.casita.toLowerCase() === searchLower || 
      row.quien_revisa.toLowerCase().includes(searchLower) ||
      row.caja_fuerte.toLowerCase().includes(searchLower);

    return cajaFuerteMatch && searchMatch;
  });

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

  const handleZoomIn = () => setZoom(z => Math.min(5, z + 0.2));
  const handleZoomOut = () => {
    const newZoom = Math.max(0.2, zoom - 0.2);
    if (newZoom <= 1) {
      setPosition({ x: 0, y: 0 });
    }
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tableContainerRef.current) {
      setStartX(e.pageX - tableContainerRef.current.offsetLeft);
      setScrollLeft(tableContainerRef.current.scrollLeft);
      tableContainerRef.current.style.cursor = 'grabbing';
      tableContainerRef.current.style.userSelect = 'none';
    }
  };

  const handleMouseLeave = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.style.cursor = 'grab';
      tableContainerRef.current.style.userSelect = 'auto';
    }
    setStartX(0);
    setScrollLeft(0);
  };

  const handleMouseUp = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.style.cursor = 'grab';
      tableContainerRef.current.style.userSelect = 'auto';
    }
    setStartX(0);
    setScrollLeft(0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (startX && tableContainerRef.current) {
      e.preventDefault();
      const x = e.pageX - tableContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      const newScrollLeft = scrollLeft - walk;
      
      // Prevenir el scroll más allá de los límites
      const maxScroll = tableContainerRef.current.scrollWidth - tableContainerRef.current.clientWidth;
      tableContainerRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
    }
  };

  return (
    <main className="min-h-screen relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1a1f35] via-[#2a3347] to-[#1e2538]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-[#2d364c]/70 via-[#3d4659]/30 to-transparent opacity-70"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#4a5573]/20 via-transparent to-transparent opacity-30"></div>
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* Header con diseño lujoso */}
          <div className="bg-gradient-to-r from-[#2a3347] to-[#1e2538] border-b border-[#3d4659] shadow-2xl mb-8 rounded-xl overflow-hidden">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl font-extrabold text-white text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#c9a45c] to-[#f0c987] animate-gradient">
                  Sistema de Revisión de Casitas
                </span>
              </h1>
              <p className="mt-2 text-center text-gray-400">Control y seguimiento profesional</p>
            </div>
          </div>

          <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {error && (
              <div className="mb-8 bg-red-500/10 border border-red-500 rounded-lg p-4 animate-fade-in">
                <p className="text-red-500">Error: {error}</p>
              </div>
            )}

            {/* Buscador y botón de nueva revisión */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full flex-1">
                <div className={`relative flex-1 max-w-xs transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
                  <div className="relative">
                    <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${isSearchFocused ? 'text-[#c9a45c]' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      placeholder="Buscar por casita, etc..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      className="w-full pl-10 pr-4 py-3 text-sm bg-[#1e2538]/80 backdrop-blur-md border border-[#3d4659]/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-transparent transition-all duration-300 shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_8px_16px_rgb(0_0_0/0.3)]"
                    />
                  </div>
                </div>
                {/* Filtro por Caja Fuerte */}
                <select
                  value={cajaFuerteFilter}
                  onChange={(e) => setCajaFuerteFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 text-sm bg-[#1e2538]/80 backdrop-blur-md border border-[#3d4659]/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9a45c]/50 focus:border-transparent transition-all duration-300 hover:border-[#c9a45c]/50 shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_8px_16px_rgb(0_0_0/0.3)]"
                >
                  <option value="">Todo en Caja Fuerte</option>
                  {cajaFuerteOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <Link
                href="/nueva-revision"
                className="px-6 py-3 bg-gradient-to-br from-[#c9a45c] via-[#d4b06c] to-[#f0c987] text-[#1a1f35] font-bold rounded-xl hover:from-[#d4b06c] hover:via-[#e0bc7c] hover:to-[#f7d498] transform hover:scale-[1.02] transition-all duration-200 shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] whitespace-nowrap flex items-center gap-2 group relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000 after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/20 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300 border border-[#f0c987]/20 hover:border-[#f0c987]/40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:rotate-90 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Nueva Revisión
              </Link>
            </div>

            {/* Tabla con diseño moderno */}
            {loading && !error ? (
              <div className="p-8 text-center text-gray-400 animate-pulse">
                <p>Cargando datos...</p>
              </div>
            ) : (
              <div className="relative">
                <div 
                  ref={tableContainerRef} 
                  className="overflow-x-auto relative cursor-grab max-h-[70vh] rounded-xl shadow-[0_8px_32px_rgb(0_0_0/0.2)] backdrop-blur-md bg-[#1e2538]/80 border border-[#3d4659]/50"
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                >
                  <table className="w-full whitespace-nowrap text-xs md:text-sm">
                    <thead className="sticky top-0 z-30">
                      <tr className="bg-gradient-to-r from-[#1e2538]/90 to-[#2a3347]/90 backdrop-blur-md text-gray-300 text-left">
                        <th className="sticky left-0 z-40 bg-gradient-to-r from-[#1e2538]/90 to-[#2a3347]/90 backdrop-blur-md px-2 py-1 md:px-3 md:py-2 border-r border-[#3d4659]/50">Fecha</th>
                        <th className="sticky left-[95px] md:left-[120px] z-40 bg-gradient-to-r from-[#1e2538]/90 to-[#2a3347]/90 backdrop-blur-md px-2 py-1 md:px-3 md:py-2 border-r border-[#3d4659]/50">Casita</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Quien revisa</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Caja fuerte</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Puertas/Ventanas</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Chromecast</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Binoculares</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Trapo binoculares</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Speaker</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">USB Speaker</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Controles TV</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Secadora</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Accesorios secadora</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Steamer</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Bolsa vapor</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Plancha cabello</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Bulto</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Sombrero</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Bolso yute</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Camas ordenadas</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Cola caballo</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Notas</th>
                        <th className="px-2 py-1 md:px-3 md:py-2">Evidencias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((row, index) => (
                        <tr
                          key={row.id || index}
                          className="border-t border-[#3d4659]/50 text-gray-300 hover:bg-[#1e2538]/50 transition-colors duration-200"
                        >
                          <td className="sticky left-0 z-20 bg-gradient-to-r from-[#1a1f35]/90 to-[#1c2138]/90 backdrop-blur-md px-2 py-1 md:px-3 md:py-2 border-r border-[#3d4659]/50">
                            <div className="font-medium">
                              {row.created_at.replace('T', ' ').slice(0, 19)}
                            </div>
                          </td>
                          <td className="sticky left-[95px] md:left-[120px] z-20 bg-gradient-to-r from-[#1a1f35]/90 to-[#1c2138]/90 backdrop-blur-md px-2 py-1 md:px-3 md:py-2 border-r border-[#3d4659]/50">
                            <button
                              onClick={() => {
                                console.log('ID de la revisión:', row.id);
                                router.push(`/detalles/${row.id}`);
                              }}
                              className="text-sky-400 hover:text-sky-300 transition-colors underline decoration-sky-400/30 hover:decoration-sky-300/50 hover:scale-105 transform duration-200"
                            >
                              {row.casita}
                            </button>
                          </td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.quien_revisa}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.caja_fuerte}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.puertas_ventanas}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.chromecast}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.binoculares}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.trapo_binoculares}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.speaker}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.usb_speaker}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.controles_tv}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.secadora}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.accesorios_secadora}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.steamer}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.bolsa_vapor}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.plancha_cabello}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.bulto}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.sombrero}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.bolso_yute}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.camas_ordenadas}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.cola_caballo}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">{row.Notas}</td>
                          <td className="px-2 py-1 md:px-3 md:py-2">
                            {row.evidencia_01 && (
                              <button
                                type="button"
                                onClick={() => openModal(row.evidencia_01)}
                                className="text-[#c9a45c] hover:text-[#f0c987] mr-2 underline cursor-pointer hover:scale-110 transform duration-200 bg-[#1e2538]/50 px-2 py-1 rounded-lg shadow-[0_4px_8px_rgb(0_0_0/0.2)] hover:shadow-[0_4px_8px_rgb(0_0_0/0.3)] transition-all duration-200"
                                title="Ver evidencia 1"
                              >
                                1
                              </button>
                            )}
                            {row.evidencia_02 && (
                              <button
                                type="button"
                                onClick={() => openModal(row.evidencia_02)}
                                className="text-[#c9a45c] hover:text-[#f0c987] mr-2 underline cursor-pointer hover:scale-110 transform duration-200 bg-[#1e2538]/50 px-2 py-1 rounded-lg shadow-[0_4px_8px_rgb(0_0_0/0.2)] hover:shadow-[0_4px_8px_rgb(0_0_0/0.3)] transition-all duration-200"
                                title="Ver evidencia 2"
                              >
                                2
                              </button>
                            )}
                            {row.evidencia_03 && (
                              <button
                                type="button"
                                onClick={() => openModal(row.evidencia_03)}
                                className="text-[#c9a45c] hover:text-[#f0c987] underline cursor-pointer hover:scale-110 transform duration-200 bg-[#1e2538]/50 px-2 py-1 rounded-lg shadow-[0_4px_8px_rgb(0_0_0/0.2)] hover:shadow-[0_4px_8px_rgb(0_0_0/0.3)] transition-all duration-200"
                                title="Ver evidencia 3"
                              >
                                3
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {showNotasForm && (
              <NotasForm onClose={() => setShowNotasForm(false)} />
            )}

            {/* Modal de imagen */}
            {modalOpen && modalImg && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="relative w-[90vw] h-[90vh]">
                  <img
                    ref={imgRef}
                    src={modalImg}
                    alt="Evidencia"
                    className="w-full h-full object-contain"
                    style={{
                      transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
                      cursor: zoom > 1 ? 'grab' : 'default'
                    }}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDownImage}
                    onMouseMove={handleMouseMoveImage}
                    onMouseUp={handleMouseUpImage}
                    onContextMenu={handleContextMenu}
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={handleZoomIn}
                      className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <button
                      onClick={handleZoomOut}
                      className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <button
                      onClick={closeModal}
                      className="text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 