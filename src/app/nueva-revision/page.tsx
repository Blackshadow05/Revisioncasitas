'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ButtonGroup from '@/components/ButtonGroup';
import { getWeek } from 'date-fns';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useAuth } from '@/context/AuthContext';

interface RevisionData {
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
  steamer: string;
  bolsa_vapor: string;
  plancha_cabello: string;
  bulto: string;
  sombrero: string;
  bolso_yute: string;
  camas_ordenadas: string;
  cola_caballo: string;
  evidencia_01: File | string;
  evidencia_02: File | string;
  evidencia_03: File | string;
  faltantes: string;
}

interface FileData {
  evidencia_01: File | null;
  evidencia_02: File | null;
  evidencia_03: File | null;
}

const initialFormData: RevisionData = {
  casita: '',
  quien_revisa: '',
  caja_fuerte: '',
  puertas_ventanas: '',
  chromecast: '',
  binoculares: '',
  trapo_binoculares: '',
  speaker: '',
  usb_speaker: '',
  controles_tv: '',
  secadora: '',
  accesorios_secadora: '',
  accesorios_secadora_faltante: '',
  steamer: '',
  bolsa_vapor: '',
  plancha_cabello: '',
  bulto: '',
  sombrero: '',
  bolso_yute: '',
  camas_ordenadas: '',
  cola_caballo: '',
  evidencia_01: '',
  evidencia_02: '',
  evidencia_03: '',
  faltantes: '',
};

const initialFileData: FileData = {
  evidencia_01: null,
  evidencia_02: null,
  evidencia_03: null,
};

const nombresRevisores = [
  'Ricardo B', 'Michael J', 'Ramiro Q', 'Adrian S', 'Esteban B',
  'Willy G', 'Juan M', 'Olman Z', 'Daniel V', 'Jefferson V',
  'Cristopher G', 'Emerson S', 'Joseph R'
];

export default function NuevaRevision() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<RevisionData>({
    ...initialFormData,
    quien_revisa: user || ''
  });

  // Efecto para actualizar quien_revisa cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        quien_revisa: user
      }));
    }
  }, [user]);

  const showEvidenceFields = ['Check in', 'Upsell', 'Back to Back'].includes(formData.caja_fuerte);

  const handleInputChange = (field: keyof RevisionData, value: string) => {
    if (error) setError(null);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: keyof FileData, file: File | null) => {
    if (error) setError(null);
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Error al comprimir la imagen'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Obtener fecha y hora local del dispositivo
      const now = new Date();
      const fechaLocal = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      const nowISO = fechaLocal.toISOString();

      const requiredFields: (keyof Omit<RevisionData, 'accesorios_secadora_faltante' | 'faltantes' | 'evidencia_02' | 'evidencia_03'>)[] = [
        'casita', 'quien_revisa', 'caja_fuerte', 'puertas_ventanas',
        'chromecast', 'binoculares', 'trapo_binoculares', 'speaker',
        'usb_speaker', 'controles_tv', 'secadora', 'accesorios_secadora',
        'steamer', 'bolsa_vapor', 'plancha_cabello', 'bulto', 'sombrero',
        'bolso_yute', 'camas_ordenadas', 'cola_caballo'
      ];
      
      for (const field of requiredFields) {
        if (!formData[field]) {
          const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          setError(`El campo "${fieldName}" es obligatorio.`);
          return;
        }
      }
      
      if (showEvidenceFields && !formData.evidencia_01) {
        setError('El campo "Evidencia 1" es obligatorio cuando se selecciona Check in, Upsell, o Back to Back.');
        return;
      }

      const uploadedUrls = {
        evidencia_01: '',
        evidencia_02: '',
        evidencia_03: '',
      };

      if (formData.evidencia_01 instanceof File) {
        const compressedFile = await compressImage(formData.evidencia_01);
        uploadedUrls.evidencia_01 = await uploadToCloudinary(compressedFile);
      }

      if (formData.evidencia_02 instanceof File) {
        const compressedFile = await compressImage(formData.evidencia_02);
        uploadedUrls.evidencia_02 = await uploadToCloudinary(compressedFile);
      }

      if (formData.evidencia_03 instanceof File) {
        const compressedFile = await compressImage(formData.evidencia_03);
        uploadedUrls.evidencia_03 = await uploadToCloudinary(compressedFile);
      }

      const { faltantes, accesorios_secadora_faltante, ...restOfFormData } = formData;

      const notas_completas = [
        accesorios_secadora_faltante ? `Faltante accesorios secadora: ${accesorios_secadora_faltante}` : '',
        faltantes ? `Faltantes generales: ${faltantes}` : ''
      ].filter(Boolean).join('\n');

      const { error } = await supabase
        .from('revisiones_casitas')
        .insert([
          {
            casita: formData.casita,
            quien_revisa: formData.quien_revisa,
            caja_fuerte: formData.caja_fuerte,
            puertas_ventanas: formData.puertas_ventanas,
            chromecast: formData.chromecast,
            binoculares: formData.binoculares,
            trapo_binoculares: formData.trapo_binoculares,
            speaker: formData.speaker,
            usb_speaker: formData.usb_speaker,
            controles_tv: formData.controles_tv,
            secadora: formData.secadora,
            accesorios_secadora: formData.accesorios_secadora,
            steamer: formData.steamer,
            bolsa_vapor: formData.bolsa_vapor,
            plancha_cabello: formData.plancha_cabello,
            bulto: formData.bulto,
            sombrero: formData.sombrero,
            bolso_yute: formData.bolso_yute,
            camas_ordenadas: formData.camas_ordenadas,
            cola_caballo: formData.cola_caballo,
            Notas: notas_completas,
            evidencia_01: uploadedUrls.evidencia_01,
            evidencia_02: uploadedUrls.evidencia_02,
            evidencia_03: uploadedUrls.evidencia_03,
            created_at: nowISO
          }
        ]);

      if (error) throw error;

      router.push('/');
    } catch (error: any) {
      console.error('Error al guardar la revisión:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a1f35] to-[#2d364c] py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-[#2a3347] rounded-xl shadow-2xl p-4 md:p-8 border border-[#3d4659]">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#c9a45c]">Nueva Revisión</h1>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-3 py-1 md:px-4 md:py-2 text-sm text-[#1a1f35] bg-gradient-to-br from-[#c9a45c] via-[#d4b06c] to-[#f0c987] rounded-xl hover:from-[#d4b06c] hover:via-[#e0bc7c] hover:to-[#f7d498] transform hover:scale-[1.02] transition-all duration-200 shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000 after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/20 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300 border border-[#f0c987]/20 hover:border-[#f0c987]/40"
            >
              Volver
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Casita <span className="text-red-500">*</span></label>
                <select
                  required
                  className="w-full px-4 py-2 md:py-3 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a45c] focus:border-transparent transition-all"
                  value={formData.casita}
                  onChange={(e) => handleInputChange('casita', e.target.value)}
                >
                  <option value="">Seleccionar casita</option>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Quien revisa <span className="text-red-500">*</span></label>
                {user ? (
                  <input
                    type="text"
                    value={user}
                    readOnly
                    className="w-full px-4 py-2 md:py-3 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a45c] focus:border-transparent transition-all"
                  />
                ) : (
                  <select
                    required
                    className="w-full px-4 py-2 md:py-3 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a45c] focus:border-transparent transition-all"
                    value={formData.quien_revisa}
                    onChange={(e) => handleInputChange('quien_revisa', e.target.value)}
                  >
                    <option value="">Seleccionar persona</option>
                    {nombresRevisores.map(nombre => (
                      <option key={nombre} value={nombre}>{nombre}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <ButtonGroup
              label="Guardado en la caja fuerte?"
              options={['Si', 'No', 'Check in', 'Check out', 'Upsell', 'Guardar Upsell', 'Back to Back', 'Show Room']}
              selectedValue={formData.caja_fuerte}
              onSelect={(value) => handleInputChange('caja_fuerte', value)}
              required
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">¿Puertas y ventanas? (revisar casa por fuera) <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 md:py-3 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a45c] focus:border-transparent transition-all"
                value={formData.puertas_ventanas}
                onChange={(e) => handleInputChange('puertas_ventanas', e.target.value)}
                placeholder="Estado de puertas y ventanas"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <ButtonGroup label="Chromecast" options={['0', '01', '02', '03', '04']} selectedValue={formData.chromecast} onSelect={v => handleInputChange('chromecast', v)} required />
              <ButtonGroup label="Binoculares" options={['0', '01', '02', '03']} selectedValue={formData.binoculares} onSelect={v => handleInputChange('binoculares', v)} required />
              <ButtonGroup label="Trapo para los binoculares" options={['Si', 'No']} selectedValue={formData.trapo_binoculares} onSelect={v => handleInputChange('trapo_binoculares', v)} required />
              <ButtonGroup label="Speaker" options={['0', '01', '02', '03']} selectedValue={formData.speaker} onSelect={v => handleInputChange('speaker', v)} required />
              <ButtonGroup label="USB Speaker" options={['0', '01', '02', '03']} selectedValue={formData.usb_speaker} onSelect={v => handleInputChange('usb_speaker', v)} required />
              <ButtonGroup label="Controles TV" options={['0', '01', '02', '03']} selectedValue={formData.controles_tv} onSelect={v => handleInputChange('controles_tv', v)} required />
              <ButtonGroup label="Secadora" options={['0', '01', '02', '03']} selectedValue={formData.secadora} onSelect={v => handleInputChange('secadora', v)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Accesorios secadora <span className="text-red-500">*</span></label>
                <select
                  required
                  className="w-full px-4 py-2 md:py-3 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white focus:ring-2 focus:ring-[#c9a45c]"
                  value={formData.accesorios_secadora}
                  onChange={(e) => handleInputChange('accesorios_secadora', e.target.value)}
                >
                  <option value="">Seleccionar cantidad</option>
                  <option key="0" value="0">0</option>
                  {Array.from({ length: 8 }, (_, i) => String(i + 1).padStart(2, '0')).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">En caso de faltar un accesorio. Cual es?</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 md:py-3 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white focus:ring-2 focus:ring-[#c9a45c]"
                  value={formData.accesorios_secadora_faltante}
                  onChange={(e) => handleInputChange('accesorios_secadora_faltante', e.target.value)}
                  placeholder="Describe el accesorio faltante"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <ButtonGroup label="Steamer (plancha a vapor)" options={['0', '01', '02']} selectedValue={formData.steamer} onSelect={v => handleInputChange('steamer', v)} required />
              <ButtonGroup label="Bolsa de vapor (plancha vapor)" options={['Si', 'No']} selectedValue={formData.bolsa_vapor} onSelect={v => handleInputChange('bolsa_vapor', v)} required />
              <ButtonGroup label="Plancha cabello" options={['0', '01', '02']} selectedValue={formData.plancha_cabello} onSelect={v => handleInputChange('plancha_cabello', v)} required />
              <ButtonGroup label="Bulto" options={['0', '01', '02']} selectedValue={formData.bulto} onSelect={v => handleInputChange('bulto', v)} required />
              <ButtonGroup label="Sombrero" options={['0', '01', '02']} selectedValue={formData.sombrero} onSelect={v => handleInputChange('sombrero', v)} required />
              <ButtonGroup label="Bolso yute" options={['0', '01', '02', '03']} selectedValue={formData.bolso_yute} onSelect={v => handleInputChange('bolso_yute', v)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <ButtonGroup label="Camas ordenadas" options={['Si', 'No']} selectedValue={formData.camas_ordenadas} onSelect={v => handleInputChange('camas_ordenadas', v)} required />
              <ButtonGroup label="Cola de caballo" options={['Si', 'No']} selectedValue={formData.cola_caballo} onSelect={v => handleInputChange('cola_caballo', v)} required />
            </div>

            {showEvidenceFields && (
              <div>
                <h3 className="text-xl font-bold text-gray-200 mb-4 border-b border-[#3d4659] pb-2">Evidencias y Notas</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Evidencia 1 (URL) <span className="text-red-500">*</span></label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#c9a45c]/20 file:text-[#c9a45c] hover:file:bg-[#c9a45c]/30"
                      onChange={(e) => handleFileChange('evidencia_01', e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Evidencia 2 (URL)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#c9a45c]/20 file:text-[#c9a45c] hover:file:bg-[#c9a45c]/30"
                      onChange={(e) => handleFileChange('evidencia_02', e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Evidencia 3 (URL)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#c9a45c]/20 file:text-[#c9a45c] hover:file:bg-[#c9a45c]/30"
                      onChange={(e) => handleFileChange('evidencia_03', e.target.files ? e.target.files[0] : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Notas</label>
                    <textarea
                      className="w-full px-4 py-2 md:py-3 bg-[#1e2538] border border-[#3d4659] rounded-lg text-white focus:ring-2 focus:ring-[#c9a45c]"
                      value={formData.faltantes}
                      onChange={(e) => handleInputChange('faltantes', e.target.value)}
                      placeholder="Describe cualquier otro elemento faltante o comentario general..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500 rounded-lg p-4">
                  <p className="text-red-500 text-center font-semibold">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`w-full ${loading ? 'bg-[#00ff00] text-white' : 'bg-gradient-to-br from-[#c9a45c] via-[#d4b06c] to-[#f0c987] text-[#1a1f35]'} font-bold px-8 py-3 md:py-4 rounded-xl transform hover:scale-[1.02] transition-all duration-200 shadow-[0_8px_16px_rgb(0_0_0/0.2)] hover:shadow-[0_12px_24px_rgb(0_0_0/0.3)] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-${loading ? '[#00ff00]/20' : 'white/40'} before:to-transparent before:translate-x-[-200%] before:animate-shimmer before:transition-transform before:duration-1000 after:absolute after:inset-0 after:bg-gradient-to-b after:from-${loading ? '[#00ff00]/10' : 'white/20'} after:to-transparent after:opacity-100 after:transition-opacity after:duration-300 border-2 border-white/40 hover:border-white/60 ${loading ? 'opacity-100 cursor-wait' : ''}`}
              >
                {loading ? 'Guardando...' : 'Guardar Revisión'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
} 