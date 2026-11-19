import { ContentIdea, BusinessContentProfile, SocialPlatform, TrendArchetype } from '../types';

export const TREND_ARCHETYPES: { id: TrendArchetype; label: string; icon: string; description: string }[] = [
  { id: 'pov', label: 'POV & Empatía', icon: '🎭', description: 'Ganchos visuales que ponen al espectador en primera persona para máxima empatía.' },
  { id: '3_errores', label: '3 Errores Fatales', icon: '⚠️', description: 'Ganchos de curiosidad negativa que detienen el scroll para evitar perder dinero o tiempo.' },
  { id: 'antes_despues', label: 'Antes vs Después', icon: '🔄', description: 'Transformaciones visuales aceleradas que demuestran el resultado tangible.' },
  { id: 'detras_camaras', label: 'Detrás de Cámaras', icon: '🤫', description: 'Transparencia brutal: lo que nadie te cuenta de la industria o cómo se crea el producto.' },
  { id: 'asmr_proceso', label: 'ASMR & Proceso', icon: '🎧', description: 'Videos satisfactorios de preparación, empaque o ejecución con sonido envolvente.' },
  { id: 'skit_humor', label: 'Skit & Situaciones Reales', icon: '😂', description: 'Comedia inteligente sobre problemas cotidianos con clientes o proveedores.' },
  { id: 'mito_realidad', label: 'Mito vs Realidad', icon: '🥊', description: 'Desmontando creencias populares para posicionar al negocio como máxima autoridad.' },
  { id: 'reto_viral', label: 'Reto de 7 o 30 Días', icon: '⏱️', description: 'Formatos de seguimiento diario que generan suscriptores leales y recurrencia.' },
];

export const SOCIAL_PLATFORMS_DATA: {
  id: SocialPlatform;
  label: string;
  badgeBg: string;
  badgeText: string;
  activeBorder: string;
  iconName: string;
  focus: string;
}[] = [
  {
    id: 'tiktok',
    label: 'TikTok',
    badgeBg: 'bg-black text-cyan-400 border border-cyan-500/30',
    badgeText: 'text-cyan-400',
    activeBorder: 'border-cyan-500',
    iconName: 'Music2',
    focus: 'Ganchos de 2 segundos, sonido viral, loop infinito y dinamismo extremo',
  },
  {
    id: 'instagram',
    label: 'Instagram Reels',
    badgeBg: 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20 text-pink-700 border border-pink-300',
    badgeText: 'text-pink-600',
    activeBorder: 'border-pink-500',
    iconName: 'Instagram',
    focus: 'Estética limpia, b-roll de alta calidad, textos claros y llamado a guardar/compartir',
  },
  {
    id: 'youtube',
    label: 'YouTube Shorts',
    badgeBg: 'bg-rose-50 text-rose-700 border border-rose-200',
    badgeText: 'text-rose-600',
    activeBorder: 'border-rose-500',
    iconName: 'PlaySquare',
    focus: 'Retención de audiencia del 120%, cortes en seco y micro-documentales',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Video',
    badgeBg: 'bg-blue-50 text-blue-700 border border-blue-200',
    badgeText: 'text-blue-600',
    activeBorder: 'border-blue-500',
    iconName: 'Linkedin',
    focus: 'Casos de negocio reales, lecciones operativas y credibilidad ejecutiva',
  },
];

export const INDUSTRY_OPTIONS = [
  { id: 'gastronomia', label: 'Gastronomía & Restaurantes', icon: '🍕' },
  { id: 'inmobiliaria', label: 'Bienes Raíces & Inmobiliaria', icon: '🏡' },
  { id: 'salud_fitness', label: 'Salud, Belleza & Fitness', icon: '💪' },
  { id: 'ecommerce', label: 'E-commerce & Tiendas Online', icon: '🛍️' },
  { id: 'servicios_b2b', label: 'Servicios B2B & Consultoría', icon: '💼' },
  { id: 'educacion', label: 'Educación & Cursos Online', icon: '🎓' },
  { id: 'tecnologia', label: 'Software, SaaS & Tecnología', icon: '💻' },
  { id: 'moda_calzado', label: 'Moda, Ropa & Accesorios', icon: '👗' },
  { id: 'general', label: 'Comercio & Servicios Locales', icon: '🚀' },
];

export const BRAND_TONES = [
  { id: 'viral_divertido', label: 'Viral & Divertido (Humor, memes y cercanía)' },
  { id: 'educativo_autoridad', label: 'Educativo & Autoridad (Tips directos y datos probados)' },
  { id: 'inspiracional', label: 'Inspiracional & Emotivo (Historias de superación y clientes)' },
  { id: 'disruptivo', label: 'Disruptivo & Polémico (Cuestiona el status quo de la industria)' },
  { id: 'premium_elegante', label: 'Premium & Sofisticado (Calidad visual, minimalismo y estatus)' },
];

export const CAMPAIGN_GOALS = [
  { id: 'leads_whatsapp', label: 'Captar Mensajes y Leads (WhatsApp / DMs calificados)' },
  { id: 'viralidad_seguidores', label: 'Viralidad y Alcance Masivo (Crecer comunidad)' },
  { id: 'ventas_directas', label: 'Ventas Directas (Promociones o tienda online)' },
  { id: 'posicionamiento', label: 'Posicionamiento y Confianza de Marca' },
];

// Helper to generate bespoke trending content ideas adapting to the client's profile
export function generateDynamicTrends(profile: BusinessContentProfile): ContentIdea[] {
  const bName = profile.businessName.trim() || 'Tu Negocio';
  const prod = profile.mainProduct.trim() || 'tu solución principal';
  const aud = profile.targetAudience.trim() || 'tus clientes ideales';
  const diff = profile.keyDifferentiator.trim() || 'atención personalizada y garantía de resultados';
  const niche = profile.industry || 'general';

  const ideas: ContentIdea[] = [
    // 1. POV / Bucle Infinito (TikTok & Reels King)
    {
      id: `trend-${Date.now()}-1`,
      title: `POV: Cuando descubres el secreto de ${bName} para ${prod}`,
      niche: profile.industry,
      archetype: 'pov',
      archetypeLabel: 'POV & Bucle Infinito',
      platform: 'tiktok',
      platformsSupported: ['tiktok', 'instagram', 'youtube'],
      viralScore: 98,
      hookSpoken: `“Ojalá alguien me hubiera advertido esto antes de buscar ${prod}...”`,
      hookOnScreen: `POV: Cuando finalmente pruebas ${bName} 🤯`,
      hookVisualAction: 'Toma en primera persona mirando la pantalla o el producto con expresión de asombro total, acercamiento rápido (zoom in de 0.5s).',
      conceptSummary: `Formato de alta retención que inicia con intriga y conecta el dolor de ${aud} con la revelación de ${prod}, terminando en bucle continuo.`,
      scriptSteps: [
        {
          timeRange: '0s - 3s',
          stepTitle: 'Gancho de Interrupción de Patrón',
          description: 'Aparece en pantalla con texto contrastante en amarillo/negro. Sin rodeos ni saludos.',
          spokenText: `Ojalá alguien me hubiera advertido esto antes de buscar ${prod}...`,
          visualCue: 'Acercamiento rápido a cámara con corte en 1.5s',
          screenCaption: `No cometas este error con tu ${prod} ❌`,
        },
        {
          timeRange: '3s - 12s',
          stepTitle: 'El Dolor Común',
          description: `Describe el problema típico que sufre ${aud} cuando acude a la competencia o soluciones baratas.`,
          spokenText: `Casi todos gastan tiempo y dinero probando opciones que prometen mucho pero te dejan a medias.`,
          visualCue: 'Tomas de b-roll rápidas mostrando el caos o la frustración habitual',
          screenCaption: 'Lo que casi todos hacen mal 😩',
        },
        {
          timeRange: '12s - 25s',
          stepTitle: 'La Revelación de la Solución',
          description: `Muestra cómo ${bName} resuelve el problema gracias a ${diff}.`,
          spokenText: `Hasta que conoces cómo trabajamos en ${bName}. No solo entregamos ${prod}, sino que ${diff}.`,
          visualCue: 'Tomas nítidas del producto o servicio en acción, con cortes rítmicos al beat',
          screenCaption: `El secreto: ${diff} ✨`,
        },
        {
          timeRange: '25s - 35s',
          stepTitle: 'Llamado a la Acción en Bucle',
          description: 'Cierre magnético diseñado para que el video vuelva a empezar naturalmente.',
          spokenText: `Comenta 'INFO' o toca el link del perfil para apartar el tuyo, porque...`,
          visualCue: 'Apuntando al perfil y transición en bucle hacia el inicio',
          screenCaption: `Comenta INFO para enviarte la guía privada 📲`,
        },
      ],
      soundTrend: {
        name: 'Trending Synth Beat (Aceleración de BPM)',
        type: 'synth_beat',
        vibe: 'Moderno, rápido, enganchante y rítmico',
        exampleSearch: 'Buscar en TikTok: "aesthetic fast beat trend" o "curiosity background music"',
      },
      caption: `Si eres de los que buscan calidad de verdad en ${prod}, esto te interesa. En ${bName} eliminamos los dolores de cabeza de raíz con ${diff}. Comenta 'QUIERO' y te mandamos una asesoría personalizada por mensaje privado directo. 👇📲`,
      hashtags: ['#tipsdenegocios', '#tendencias', '#aprendeentiktok', '#reelsviral', '#emprendedores', `#${bName.toLowerCase().replace(/[^a-z0-9]/g, '')}`],
      recordingTips: [
        'Graba en vertical 9:16 en 4K a 60fps para poder hacer zooms digitales sin perder nitidez.',
        'Los primeros 2 segundos deben tener un corte o movimiento de cámara continuo.',
        'Usa subtítulos animados en el tercio medio de la pantalla con palabras clave coloreadas.',
      ],
      ctaGoal: 'Generar comentarios clave ("INFO") que activen el algoritmo y permitan mandar mensaje.',
    },

    // 2. Formato 3 Errores Fatales (Curiosidad Negativa - Instagram Reels & Shorts)
    {
      id: `trend-${Date.now()}-2`,
      title: `3 Errores Fatales que cometen con ${prod} (y cómo evitarlos)`,
      niche: profile.industry,
      archetype: '3_errores',
      archetypeLabel: '3 Errores Fatales & Autoridad',
      platform: 'instagram',
      platformsSupported: ['instagram', 'youtube', 'tiktok', 'linkedin'],
      viralScore: 95,
      hookSpoken: `“Si estás a punto de invertir en ${prod}, por favor NO cometas el error número 2.”`,
      hookOnScreen: `3 Errores con tu ${prod} que te cuestan DINERO 🛑`,
      hookVisualAction: 'Gesto firme con la mano hacia la cámara, sosteniendo un objeto o señalando hacia un letrero de advertencia.',
      conceptSummary: `Estructura de autoridad probada. La curiosidad negativa retiene hasta el 85% de la audiencia hasta revelar el último consejo.`,
      scriptSteps: [
        {
          timeRange: '0s - 4s',
          stepTitle: 'Gancho de Alerta',
          description: 'Avisa a la audiencia que están perdiendo recursos valiosos sin saberlo.',
          spokenText: `Si estás buscando ${prod}, el error número dos te está costando más de lo que crees.`,
          visualCue: 'Mirando fijamente a la cámara con micro de solapa visible',
          screenCaption: 'ALERTA: Deja de hacer esto 🚫',
        },
        {
          timeRange: '4s - 15s',
          stepTitle: 'Error 1: Fijarse solo en el precio barato',
          description: 'Desmitifica la creencia de que lo más económico funciona igual.',
          spokenText: `Error uno: Elegir solo por el precio más bajo. Lo barato termina saliendo el triple.`,
          visualCue: 'Gráfico o demostración visual rápida en pantalla dividida',
          screenCaption: 'Error #1: Lo barato sale 3 veces más caro',
        },
        {
          timeRange: '15s - 30s',
          stepTitle: `Error 2: No exigir ${diff}`,
          description: `Aquí insertas la ventaja competitiva de ${bName} como la solución indispensable.`,
          spokenText: `Error dos: No verificar la garantía y el respaldo. En ${bName} nosotros siempre garantizamos ${diff}.`,
          visualCue: 'Tomas del equipo trabajando o del empaque premium del producto',
          screenCaption: `Error #2: Olvidarse de ${diff}`,
        },
        {
          timeRange: '30s - 45s',
          stepTitle: 'Error 3 y Llamado a la Acción',
          description: 'El tercer error es posponer la decisión.',
          spokenText: `Y error tres: Dejarlo para después. Guarda este reel para que no se te olvide y síguenos para más consejos.`,
          visualCue: 'Señalando el botón de guardar en la esquina inferior derecha',
          screenCaption: 'Guarda este video antes de que se te pierda 📌',
        },
      ],
      soundTrend: {
        name: 'Voz limpia con micrófono de solapa + Beat Lofi ambiental suave',
        type: 'lofi_chill',
        vibe: 'Profesional, confiable, calmado pero asertivo',
        exampleSearch: 'Buscar en Instagram: "chill business lofi study beat"',
      },
      caption: `¿Cuántos de estos 3 errores has cometido con ${prod}? El segundo es el que más pérdidas genera. En ${bName} diseñamos cada detalle para darte ${diff}. Guarda este post para consultarlo cuando vayas a tomar una decisión y compártelo con alguien que lo necesite. 📌💡`,
      hashtags: ['#errorescomunes', '#consejosutiles', '#calidadgarantizada', '#reelsnegocios', '#crecimientopersonal', '#estrategia'],
      recordingTips: [
        'Utiliza un micrófono lavalier (de solapa) cerca de la boca para sonido cristalino y cercano.',
        'Pon textos grandes en las primeras 2 líneas para que se lean aun con el audio silenciado.',
        'La duración ideal es de 35 a 45 segundos para maximizar la tasa de finalización.',
      ],
      ctaGoal: 'Generar guardados masivos (el factor número 1 del algoritmo de Instagram en 2026).',
    },

    // 3. Antes vs Después / Transformación Real
    {
      id: `trend-${Date.now()}-3`,
      title: `Transformación Real: El resultado de aplicar ${prod} en ${bName}`,
      niche: profile.industry,
      archetype: 'antes_despues',
      archetypeLabel: 'Antes vs Después & Prueba Social',
      platform: 'youtube',
      platformsSupported: ['youtube', 'tiktok', 'instagram'],
      viralScore: 96,
      hookSpoken: `“Mira cómo llegó este cliente a nosotros y mira cómo quedó 48 horas después.”`,
      hookOnScreen: `El cambio que todos nos piden ver... 😱`,
      hookVisualAction: 'Muestra una foto o toma del "Antes" con aspecto gris/desordenado, luego chasquido de dedos para la transición al "Después" reluciente.',
      conceptSummary: `La prueba social visual más potente en video corto: contraste extremo entre el problema inicial y el resultado brillante con música de impacto.`,
      scriptSteps: [
        {
          timeRange: '0s - 3s',
          stepTitle: 'El Gancho Visual de Contraste',
          description: 'Muestra la situación inicial sin embellecerla, generando intriga de cómo se solucionará.',
          spokenText: `Mira cómo empezó este proyecto para ${aud}...`,
          visualCue: 'Enfocando el estado inicial con cámara lenta y música en pausa',
          screenCaption: 'ANTES: Así estaba el problema... 😳',
        },
        {
          timeRange: '3s - 15s',
          stepTitle: 'El Proceso Rápido (Time-Lapse / Beat Drop)',
          description: 'Cortes súper veloces (0.5s por toma) mostrando el trabajo experto y las manos a la obra.',
          spokenText: `Muchos creían que no se podía salvar, pero aplicamos nuestra metodología con ${prod}.`,
          visualCue: 'Tomas aceleradas al ritmo del beat de transición',
          screenCaption: 'En proceso: Manos a la obra ⚙️',
        },
        {
          timeRange: '15s - 30s',
          stepTitle: 'El Resultado Revelado (El Después)',
          description: `Revelación con música épica y tomas cinematográficas del producto final entregado por ${bName}.`,
          spokenText: `Y este es el resultado final. Impecable, a tiempo y con ${diff}.`,
          visualCue: 'Toma panorámica lenta con iluminación cálida y detalles en primer plano',
          screenCaption: 'DESPUÉS: Resultado 100% garantizado ✨',
        },
        {
          timeRange: '30s - 45s',
          stepTitle: 'Llamado a la Transformación',
          description: 'Pregunta a la audiencia si quieren un resultado similar.',
          spokenText: `Si tú también quieres una transformación así, mándanos un mensaje directo y te cotizamos gratis hoy mismo.`,
          visualCue: 'Tarjeta final elegante con el logo de la empresa y contacto',
          screenCaption: 'Cotiza tu transformación en el link de la bio 🚀',
        },
      ],
      soundTrend: {
        name: 'Beat Drop Épico de Transición (Whoosh + Bass Drop)',
        type: 'pop_upbeat',
        vibe: 'Energético, transformacional y emocionante',
        exampleSearch: 'Buscar: "transformation beat drop" o "before after transition sound viral"',
      },
      caption: `¡Los resultados hablan por sí mismos! 🙌 Cuando combinas ${prod} con la experiencia de ${bName}, las transformaciones son así de contundentes. Si tú o tu empresa quieren dar el siguiente paso, escríbenos ahora y recibe una propuesta a la medida. 📲⚡`,
      hashtags: ['#transformacion', '#antesydespues', '#satisfactorio', '#viralshorts', '#casodeexito', '#clientesfelices'],
      recordingTips: [
        'Asegúrate de que el encuadre del Antes y del Después sea idéntico para que la transición sea perfecta.',
        'Sincroniza el chasquido de dedos o el corte exactamente con el golpe de bajo de la música.',
      ],
      ctaGoal: 'Generar consultas directas de clientes que buscan el mismo resultado.',
    },

    // 4. Lo que nadie te dice en tu industria / Detrás de Cámaras (TikTok & Reels)
    {
      id: `trend-${Date.now()}-4`,
      title: `Lo que NADIE te dice sobre ${prod} en la industria`,
      niche: profile.industry,
      archetype: 'detras_camaras',
      archetypeLabel: 'Secretos de la Industria & Transparencia',
      platform: 'tiktok',
      platformsSupported: ['tiktok', 'instagram', 'linkedin', 'youtube'],
      viralScore: 97,
      hookSpoken: `“Probablemente me odien en mi rubro por revelar esto, pero tienes que saberlo...”`,
      hookOnScreen: `Lo que las empresas de ${niche} te OCULTAN 🤫`,
      hookVisualAction: 'Voz en tono confidencial, mirando a los lados como si estuvieras contando un secreto no autorizado.',
      conceptSummary: `El formato de "insider" genera picos gigantescos de comentarios y compartidos por WhatsApp porque rompe el tabú corporativo.`,
      scriptSteps: [
        {
          timeRange: '0s - 4s',
          stepTitle: 'El Gancho Prohibido',
          description: 'Crea sensación de información privilegiada y exclusiva.',
          spokenText: `Probablemente me reclamen por decir esto en internet, pero como fundador de ${bName} prefiero la verdad.`,
          visualCue: 'Cámara en mano estilo vlog íntimo, iluminación natural',
          screenCaption: 'No se supone que sepas esto... 👀',
        },
        {
          timeRange: '4s - 18s',
          stepTitle: 'El Secreto Revelado',
          description: `Explica un truco o práctica dudosa que usan otros proveedores para cobrar de más.`,
          spokenText: `Muchas veces te cobran el doble diciendo que incluye cosas exclusivas, cuando en realidad solo están inflando el costo sin darte ${diff}.`,
          visualCue: 'Paseando por la oficina o taller mostrando la realidad de trabajo',
          screenCaption: 'La verdad sobre los costos reales 💸',
        },
        {
          timeRange: '18s - 35s',
          stepTitle: `Nuestra Filosofía en ${bName}`,
          description: 'Posiciona la transparencia como el mayor valor de tu negocio.',
          spokenText: `Por eso nosotros transparentamos todo desde el día uno. Con ${bName} sabes exactamente qué recibes por tu dinero con ${prod}.`,
          visualCue: 'Mostrando pantallas reales, contratos claros o material de calidad',
          screenCaption: 'Por esto hacemos las cosas diferente 🛡️',
        },
        {
          timeRange: '35s - 50s',
          stepTitle: 'Debate en Comentarios',
          description: 'Pide la opinión de la comunidad para que el algoritmo multiplique el alcance.',
          spokenText: `¿Te ha pasado alguna vez que te cobren de más? Cuéntamelo en los comentarios, los leo a todos.`,
          visualCue: 'Sonrisa sincera mirando a cámara',
          screenCaption: '¿Te ha pasado esto a ti? Déjame tu opinión 👇',
        },
      ],
      soundTrend: {
        name: 'Audio de Suspenso Suave con Cuerdas (Cinematic Tension)',
        type: 'suspense_rising',
        vibe: 'Misterioso, intrigante y honesto',
        exampleSearch: 'Buscar: "suspense mystery background" o "documentary secret reveal audio"',
      },
      caption: `La honestidad siempre paga mejor a largo plazo. 🤝 En un mercado lleno de promesas vacías sobre ${prod}, en ${bName} preferimos mostrarte las cosas como son, con números claros y ${diff}. ¿Tú qué opinas de esta práctica? Cuéntanos en los comentarios. 👇`,
      hashtags: ['#transparencia', '#secretosdenegocio', '#emprendimiento', '#verdadesqueduelen', '#storytime', '#polemica'],
      recordingTips: [
        'Habla de forma natural, sin leer ni parecer un comercial publicitario forzado.',
        'La luz natural de ventana funciona mucho mejor que luces artificiales de estudio para este formato íntimo.',
      ],
      ctaGoal: 'Disparar debates acalorados en comentarios que duplican el alcance orgánico.',
    },

    // 5. ASMR & Proceso Satisfactorio (Instagram Reels & TikTok)
    {
      id: `trend-${Date.now()}-5`,
      title: `Preparando un pedido de ${prod} en ${bName} (Sonido ASMR 🎧)`,
      niche: profile.industry,
      archetype: 'asmr_proceso',
      archetypeLabel: 'ASMR & Proceso Hipnótico',
      platform: 'instagram',
      platformsSupported: ['instagram', 'tiktok', 'youtube'],
      viralScore: 94,
      hookSpoken: `(Sonido envolvente crujiente o de teclado/herramientas sin hablar en los primeros 5 segundos)`,
      hookOnScreen: `Ponte audífonos para ver esto 🎧✨`,
      hookVisualAction: 'Micrófono de alta fidelidad pegado al objeto, realizando la acción con movimientos precisos y agradables a la vista.',
      conceptSummary: `Los videos de proceso hipnótico sin música comercial o solo con audio ASMR tienen tasas de retención superiores al 90% y alto guardado estético.`,
      scriptSteps: [
        {
          timeRange: '0s - 5s',
          stepTitle: 'Gancho Sensorial',
          description: 'Captura inmediata por estímulo auditivo puro.',
          spokenText: `(Sonido crujiente o click satisfactorio del producto/herramienta)`,
          visualCue: 'Primerísimo primer plano macro en ultra alta definición',
          screenCaption: 'Sonido 100% real: Activa el audio 🔊',
        },
        {
          timeRange: '5s - 25s',
          stepTitle: 'El Detalle Obsesivo de Calidad',
          description: `Muestra el cuidado milimétrico con el que se prepara ${prod} para ${aud}.`,
          spokenText: `En ${bName} cada pieza de ${prod} pasa por este control riguroso de calidad.`,
          visualCue: 'Tomas continuas de corte, ensamblado, empaque o entrega sin cortes bruscos',
          screenCaption: 'Obsesión por los pequeños detalles 👌',
        },
        {
          timeRange: '25s - 40s',
          stepTitle: 'El Empaque Final Impecable',
          description: `El toque final con ${diff}.`,
          spokenText: `Listo para ser entregado a su nuevo dueño. ¿Se nota el cariño que le ponemos?`,
          visualCue: 'Sello de garantía, pegatina o apretón de manos con cliente',
          screenCaption: 'Empacado con amor para nuestros clientes 📦🤍',
        },
      ],
      soundTrend: {
        name: 'Audio Binaural ASMR Real (Grabación con micrófono estéreo)',
        type: 'acoustic_guitar',
        vibe: 'Satisfactorio, relajante, hipnótico y adictivo',
        exampleSearch: 'Buscar: "satisfying packaging asmr" o "craftsman process audio"',
      },
      caption: `El arte de cuidar cada detalle en ${bName}. 🎧✨ Cuando compras ${prod}, no solo recibes un servicio o producto, recibes horas de dedicación artesanal y ${diff}. ¿Te relaja tanto como a nosotros ver este proceso? Guarda este video para cuando necesites 30 segundos de paz mental. 💆`,
      hashtags: ['#asmr', '#satisfactorio', '#detrasdecamaras', '#empaque', '#proceso', '#calidadartesanal'],
      recordingTips: [
        'Usa un micrófono conectado directo a tu teléfono para captar crujidos, tijeras, cierres o tecleos nítidos.',
        'Limpia bien los lentes y el área de trabajo; en video macro cualquier mota de polvo se nota.',
      ],
      ctaGoal: 'Maximizar tiempo de visualización repetida y guardados estéticos.',
    },

    // 6. Skit de Humor Identificable (TikTok & Reels)
    {
      id: `trend-${Date.now()}-6`,
      title: `Cuando intentas resolver ${prod} tú solo vs cuando contratas a ${bName}`,
      niche: profile.industry,
      archetype: 'skit_humor',
      archetypeLabel: 'Humor & Situación Identificable',
      platform: 'tiktok',
      platformsSupported: ['tiktok', 'instagram'],
      viralScore: 93,
      hookSpoken: `“Yo jurando que podía ahorrarme unos pesos haciéndolo yo mismo...”`,
      hookOnScreen: `Cuando dices: "Yo conozco a alguien que lo hace más barato" 😂`,
      hookVisualAction: 'Actuación de doble personaje (usando una gorra o lentes para distinguir al cliente del experto).',
      conceptSummary: `El humor autocrítico genera viralidad natural porque la gente etiqueta a sus amigos o socios en los comentarios riéndose de la anécdota.`,
      scriptSteps: [
        {
          timeRange: '0s - 4s',
          stepTitle: 'La Decisión Ingenua',
          description: 'Personaje 1 creyendo que es fácil.',
          spokenText: `¿Pagar por ${prod}? Si en YouTube hay un tutorial de 10 minutos, yo lo hago el fin de semana...`,
          visualCue: 'Personaje 1 con cara confiada frente a la laptop',
          screenCaption: 'Día 1: "Esto se ve facilito" 🤡',
        },
        {
          timeRange: '4s - 16s',
          stepTitle: 'El Desastre Inevitable',
          description: 'El resultado caótico y la desesperación.',
          spokenText: `Día 3: Todo roto, clientes llamando, estrés al límite y nada funciona.`,
          visualCue: 'Efecto de temblor de cámara con papeles volando o mirada al infinito con sonido de grillos',
          screenCaption: 'Día 3: Nada salió como el tutorial decía 😭',
        },
        {
          timeRange: '16s - 32s',
          stepTitle: 'La Llamada al Rescate',
          description: `Llamando a ${bName} para resolverlo de emergencia.`,
          spokenText: `¿Aló, ${bName}? Sí, necesito ${prod} urgente, por favor díganme que tienen espacio hoy...`,
          visualCue: 'Personaje 2 (equipo de la empresa) contestando con calma, café en mano y resolviendo todo en un click',
          screenCaption: `Cuando llega ${bName} a salvar el día 🦸‍♂️✨`,
        },
        {
          timeRange: '32s - 45s',
          stepTitle: 'Moraleja y Cierre Gracioso',
          description: 'No te compliques la vida cuando existen profesionales.',
          spokenText: `Ahorra tiempo, canas y dinero desde el principio. Mándanos mensaje y lo resolvemos en tiempo récord con ${diff}.`,
          visualCue: 'Los dos personajes saludándose y guiño a la cámara',
          screenCaption: 'Etiqueta a tu amigo que siempre quiere hacerlo todo solo 😅👇',
        },
      ],
      soundTrend: {
        name: 'Audio de Comedia Viral de TikTok (Efecto de Risa o Sonido de Trompeta Triste)',
        type: 'comedy_audio',
        vibe: 'Cómico, simpático y autocrítico',
        exampleSearch: 'Buscar: "oh no no no meme sound" o "funny elevator fail music"',
      },
      caption: `Admitámoslo: todos hemos intentado hacer algo "nosotros mismos" para ahorrar, y terminó costando el triple de tiempo y corajes. 😅 En ${bName} nos encargamos de tu ${prod} de principio a fin para que tú solo disfrutes de los resultados con ${diff}. Etiqueta a ese amigo terco en los comentarios. 👇🤣`,
      hashtags: ['#humor', '#memesdenegocio', '#expectativavsrealidad', '#comediaviral', '#trabajointeligente', '#etiquetaatuamigo'],
      recordingTips: [
        'Usa accesorios simples como una gorra al revés para diferenciar a los personajes en el mismo espacio.',
        'La expresión facial exagerada al inicio es clave para generar empatía en los primeros 2 segundos.',
      ],
      ctaGoal: 'Generar miles de etiquetas ("mentions") en comentarios que multiplican el alcance sin pauta.',
    },
  ];

  return ideas;
}
