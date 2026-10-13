// Manual de estudio: contenido en datos. Cada ejemplo lleva su modelo de cadena, de modo que
// el nombre declarado se verifica contra el nombrador (scripts/test-manual.mjs) y se puede armar en el Constructor.
import { emptyModel } from '../lib/chem/chainModel.js'

function mk(n, { bonds = {}, at = {}, stereo } = {}) {
  const m = emptyModel(n)
  Object.entries(bonds).forEach(([i, o]) => (m.bonds[i] = o))
  Object.entries(at).forEach(([i, v]) => {
    if (v.term) m.carbons[i].term = v.term
    if (v.subs) m.carbons[i].subs = [...v.subs]
  })
  if (stereo) m.stereo = stereo
  return m
}
const s = (...subs) => ({ subs })
const t = (term) => ({ term })

/** Ejemplo resuelto: `nombre` es el nombre IUPAC que debe producir el nombrador para `model`. */
const ej = (nombre, model, porque) => ({ nombre, model, porque })

// ── Familias ─────────────────────────────────────────────────────────────────────────
// `familia` coincide con los ids de la Práctica (PRACTICE_FAMILIES) para enlazar «practicar esta familia».
export const FAMILIAS_MANUAL = [
  {
    familia: 'alcanos',
    titulo: 'Alcanos (y ramificados)',
    grupo: 'C–C (sólo enlaces simples)',
    sufijo: '-ano',
    resumen: 'Hidrocarburos saturados, CnH2n+2. Todos los carbonos son sp³ (109,5°). Las ramificaciones se nombran como alquilos.',
    regla: [
      'Elegí la cadena continua MÁS LARGA (no importa cómo esté dibujada).',
      'Numerá desde el extremo que dé el menor locante al primer sustituyente (si empatan, al siguiente).',
      'Nombrá las ramas (metil, etil…) en orden alfabético; di-, tri- no cuentan para ordenar.',
      'Armá: locantes + sustituyentes + raíz + «ano».',
    ],
    ejemplos: [
      ej('2-metilbutano', mk(4, { at: { 1: s('CH3') } }), 'La cadena más larga tiene 4 C (butano); el metilo está en C2, contando desde cualquier extremo.'),
      ej('2,3-dimetilbutano', mk(4, { at: { 1: s('CH3'), 2: s('CH3') } }), 'Dos metilos iguales: «di» y los dos locantes separados por coma.'),
      ej('3-etilpentano', mk(5, { at: { 2: s('C2H5') } }), 'Un etilo en el carbono central de 5 C. Si lo pusieras en C2, la cadena más larga cambiaría.'),
      ej('2,2-dimetilpropano', mk(3, { at: { 1: s('CH3', 'CH3') } }), 'Dos ramas en el mismo carbono: el locante se repite («2,2»).'),
    ],
    errores: [
      'Tomar la cadena «dibujada en línea recta» en vez de la más larga.',
      'Numerar desde el lado equivocado: siempre se busca el menor conjunto de locantes.',
      'Olvidar «di/tri» o la coma entre locantes iguales (2,2-, no 2-2-).',
    ],
    isomeria: 'C4H10: butano y 2-metilpropano (isómeros de cadena). C5H12: pentano, 2-metilbutano y 2,2-dimetilpropano.',
  },
  {
    familia: 'alquenos',
    titulo: 'Alquenos',
    grupo: 'C=C (carbonos sp², 120°)',
    sufijo: '-eno',
    resumen: 'Hidrocarburos con un doble enlace, CnH2n. La cadena principal DEBE contener el doble enlace.',
    regla: [
      'La cadena principal es la más larga que contiene el C=C.',
      'Numerá para que el doble enlace tenga el menor locante.',
      'El locante va delante del sufijo (IUPAC 2013: but-2-eno) o delante de la raíz (curso: 2-buteno).',
      'Si hay isomería geométrica, anteponé E (trans) o Z (cis).',
    ],
    ejemplos: [
      ej('propeno', mk(3, { bonds: { 0: 2 } }), 'Con 3 C el doble enlace sólo puede estar en C1: no hace falta locante.'),
      ej('but-1-eno', mk(4, { bonds: { 0: 2 } }), 'Doble enlace entre C1 y C2.'),
      ej('(E)-but-2-eno', mk(4, { bonds: { 1: 2 }, stereo: 'E' }), 'Los grupos CH3 de lados opuestos: E (trans). El isómero Z es el cis.'),
      ej('2-metilbut-2-eno', mk(4, { bonds: { 1: 2 }, at: { 1: s('CH3') } }), 'El doble enlace manda en la numeración; el metilo queda en C2.'),
    ],
    errores: ['Numerar por el sustituyente en vez de por el doble enlace.', 'Olvidar que but-2-eno tiene isómeros E/Z y but-1-eno no.'],
    isomeria: 'C4H8: but-1-eno, (Z)-but-2-eno, (E)-but-2-eno y metilpropeno. Los dos but-2-eno son isómeros geométricos.',
  },
  {
    familia: 'alquinos',
    titulo: 'Alquinos',
    grupo: 'C≡C (carbonos sp, 180°)',
    sufijo: '-ino',
    resumen: 'Hidrocarburos con un triple enlace, CnH2n−2. Se nombran igual que los alquenos pero con «-ino».',
    regla: [
      'Cadena más larga que contiene el triple enlace.',
      'Numerá para el menor locante del triple enlace.',
      'Con doble y triple enlace a la vez: «-en-…-ino»; si empatan en locantes, el doble tiene prioridad en la numeración.',
    ],
    ejemplos: [
      ej('propino', mk(3, { bonds: { 0: 3 } }), 'Triple enlace terminal.'),
      ej('but-2-ino', mk(4, { bonds: { 1: 3 } }), 'Triple enlace interno entre C2 y C3. No tiene isomería E/Z: es lineal.'),
      ej('4-metilpent-2-ino', mk(5, { bonds: { 1: 3 }, at: { 3: s('CH3') } }), 'El triple enlace fija la numeración (C2), el metilo queda en C4.'),
      ej('hex-1-en-4-ino', mk(6, { bonds: { 0: 2, 3: 3 } }), 'Alqueno + alquino: se escribe «en» y «ino»; el menor locante va al doble enlace si hay empate.'),
    ],
    errores: ['Buscar E/Z en un alquino (el C≡C es lineal).', 'Escribir «-ino» sin el locante cuando hace falta (pent-2-ino ≠ pent-1-ino).'],
    isomeria: 'C4H6: but-1-ino y but-2-ino (isómeros de posición).',
  },
  {
    familia: 'halogenuros',
    titulo: 'Halogenuros de alquilo',
    grupo: '–X (F, Cl, Br, I)',
    sufijo: '(sólo prefijo) fluoro-, cloro-, bromo-, yodo-',
    resumen: 'Los halógenos NUNCA son sufijo: se nombran siempre como prefijo, en orden alfabético junto con los demás sustituyentes.',
    regla: [
      'Cadena más larga (o la que lleva el grupo principal, si lo hay).',
      'Numerá para el menor locante de los sustituyentes en conjunto (halógenos y alquilos cuentan por igual).',
      'Orden alfabético: bromo, cloro, fluoro, yodo, metil… (ignorando di-, tri-).',
    ],
    ejemplos: [
      ej('clorometano', mk(1, { at: { 0: s('Cl') } }), 'Un solo C: no hace falta locante.'),
      ej('2-bromopropano', mk(3, { at: { 1: s('Br') } }), 'El halógeno en C2 (sobre el carbono central).'),
      ej('1,2-dicloroetano', mk(2, { at: { 0: s('Cl'), 1: s('Cl') } }), 'Dos cloros: «di» + dos locantes.'),
      ej('2-cloro-2-metilpropano', mk(3, { at: { 1: s('Cl', 'CH3') } }), 'Cloro y metilo en el mismo carbono; «cloro» va antes que «metil» (alfabético).'),
    ],
    errores: ['Poner el halógeno como sufijo («propanocloro»).', 'Ordenar por locante en vez de alfabéticamente.'],
    isomeria: 'C3H7Cl: 1-cloropropano y 2-cloropropano (isómeros de posición).',
  },
  {
    familia: 'alcoholes',
    titulo: 'Alcoholes',
    grupo: '–OH (hidroxilo)',
    sufijo: '-ol (prefijo: hidroxi-)',
    resumen: 'Un –OH sobre un carbono sp³. Primario (–CH2OH), secundario (–CHOH–) o terciario (–COH<).',
    regla: [
      'La cadena principal debe contener el carbono con el –OH.',
      'Numerá para que el –OH tenga el menor locante.',
      'Cambiá la «o» final de la raíz por «-ol»: propano → propan-1-ol (curso: 1-propanol).',
      'Con dos –OH: «-diol» (se conserva la «o»: propano-1,2-diol).',
    ],
    ejemplos: [
      ej('etanol', mk(2, { at: { 0: s('OH') } }), 'Con 2 C el –OH siempre queda en C1: sin locante.'),
      ej('propan-2-ol', mk(3, { at: { 1: s('OH') } }), 'Alcohol secundario. Es isómero de posición del propan-1-ol.'),
      ej('2-metilpropan-1-ol', mk(3, { at: { 0: s('OH'), 1: s('CH3') } }), 'El –OH manda en la numeración; el metilo es sustituyente.'),
      ej('propano-1,2-diol', mk(3, { at: { 0: s('OH'), 1: s('OH') } }), 'Dos –OH: «diol» y se mantiene la «o» de propano.'),
    ],
    errores: ['Numerar desde el extremo más cercano a una rama en vez del –OH.', 'Confundir «hidroxi-» (prefijo) con «-ol» (sufijo): el sufijo se usa si el –OH es el grupo principal.'],
    isomeria: 'C2H6O: etanol (alcohol) y metoximetano (éter) son isómeros de función.',
  },
  {
    familia: 'eteres',
    titulo: 'Éteres',
    grupo: 'R–O–R′',
    sufijo: '(sin sufijo) alcoxi- como prefijo',
    resumen: 'Un oxígeno entre dos carbonos. En la nomenclatura sustitutiva, la cadena MÁS LARGA es la principal y la otra parte es un «alcoxi».',
    regla: [
      'Identificá las dos partes unidas al oxígeno.',
      'La parte más larga es la cadena principal (alcano); la más corta es el alcoxi (metoxi, etoxi, propoxi, isopropoxi).',
      'Numerá la cadena para que el alcoxi tenga el menor locante.',
      'Nombre: [locante]-[alcoxi][alcano]. También se acepta el nombre radicofuncional: «etil metil éter».',
    ],
    ejemplos: [
      ej('metoxietano', mk(2, { at: { 1: s('OCH3') } }), 'Partes: CH3– y CH3CH2–. La cadena principal es el etano; el metilo + O forman «metoxi».'),
      ej('1-metoxipropano', mk(3, { at: { 0: s('OCH3') } }), 'Cadena de 3 C con el metoxi en el extremo (C1).'),
      ej('2-metoxipropano', mk(3, { at: { 1: s('OCH3') } }), 'Isómero de posición del anterior: el metoxi sobre el carbono central.'),
      ej('etoxietano', mk(2, { at: { 1: s('OC2H5') } }), 'Éter simétrico (dietil éter): las dos partes son iguales.'),
    ],
    errores: ['Tomar como principal la parte corta.', 'Olvidar que un éter no tiene sufijo propio: el nombre termina en el alcano.', 'Confundirlo con un alcohol isómero.'],
    isomeria: 'Los éteres son isómeros de función de los alcoholes (C3H8O: propan-1-ol, propan-2-ol y metoxietano).',
  },
  {
    familia: 'aldehidos',
    titulo: 'Aldehídos',
    grupo: '–CHO (C=O en el extremo de la cadena)',
    sufijo: '-al (prefijo: formil-)',
    resumen: 'El carbono carbonílico está siempre en el extremo y forma parte de la cadena: es C1.',
    regla: [
      'El carbono del –CHO es C1 siempre: no lleva locante.',
      'Cambiá la «o» final por «-al»: propano → propanal.',
      'Numerá desde el –CHO y ubicá las ramas y los enlaces múltiples.',
    ],
    ejemplos: [
      ej('etanal', mk(2, { at: { 0: t('CHO') } }), 'El C del –CHO cuenta como carbono: 2 C en total.'),
      ej('propanal', mk(3, { at: { 0: t('CHO') } }), 'Aldehído de 3 C.'),
      ej('2-metilpropanal', mk(3, { at: { 0: t('CHO'), 1: s('CH3') } }), 'La rama en C2 se numera desde el –CHO.'),
      ej('but-2-enal', mk(4, { bonds: { 1: 2 }, at: { 0: t('CHO') } }), 'El doble enlace entre C2 y C3; el sufijo «-al» después del «-en».'),
    ],
    errores: ['Poner locante «1» al –CHO (no hace falta).', 'Contar mal los carbonos: el C del –CHO es parte de la cadena.'],
    isomeria: 'Los aldehídos son isómeros de función de las cetonas (C3H6O: propanal y propanona).',
  },
  {
    familia: 'cetonas',
    titulo: 'Cetonas',
    grupo: '–CO– (C=O interno)',
    sufijo: '-ona (prefijo: oxo-)',
    resumen: 'El carbonilo está entre dos carbonos. Necesita al menos 3 C.',
    regla: [
      'La cadena principal contiene al C=O.',
      'Numerá para el menor locante del C=O.',
      'Cambiá la «o» final por «-ona»: pentano → pentan-2-ona (curso: 2-pentanona).',
      'Propanona (acetona) y butanona no necesitan locante: sólo hay una posición posible.',
    ],
    ejemplos: [
      ej('propanona', mk(3, { at: { 1: s('oxo') } }), 'Única cetona de 3 C (acetona).'),
      ej('butanona', mk(4, { at: { 1: s('oxo') } }), 'En C2 o en C3 es la misma molécula: no hace falta locante.'),
      ej('pentan-2-ona', mk(5, { at: { 1: s('oxo') } }), 'A partir de 5 C ya hay dos posiciones: pentan-2-ona y pentan-3-ona.'),
      ej('3-metilpentan-2-ona', mk(5, { at: { 1: s('oxo'), 2: s('CH3') } }), 'El C=O fija la numeración (C2); el metilo queda en C3.'),
    ],
    errores: ['Numerar desde el lado de las ramas en vez de por el C=O.', 'Confundir cetona con aldehído: si el C=O está en el extremo, es aldehído.'],
    isomeria: 'Isómero de función de los aldehídos; y entre cetonas, de posición (pentan-2-ona / pentan-3-ona).',
  },
  {
    familia: 'acidos_carboxilicos',
    titulo: 'Ácidos carboxílicos',
    grupo: '–COOH (en el extremo)',
    sufijo: '-oico (prefijo: carboxi-)',
    resumen: 'Es el grupo de MAYOR prioridad en la hoja de grupos. El carbono del –COOH es C1.',
    regla: [
      'Se antepone la palabra «ácido» y se cambia la «o» final por «-oico».',
      'El C del –COOH es C1 y no lleva locante.',
      'Con dos –COOH: «ácido …-dioico» (se conserva la «o»: ácido butanodioico).',
    ],
    ejemplos: [
      ej('ácido etanoico', mk(2, { at: { 0: t('COOH') } }), 'Nombre común: ácido acético.'),
      ej('ácido propanoico', mk(3, { at: { 0: t('COOH') } }), 'Nombre común: ácido propiónico.'),
      ej('ácido 2-metilpropanoico', mk(3, { at: { 0: t('COOH'), 1: s('CH3') } }), 'Rama en C2 contando desde el –COOH.'),
      ej('ácido butanodioico', mk(4, { at: { 0: t('COOH'), 3: t('COOH') } }), 'Dos grupos ácidos en los extremos: «dioico».'),
    ],
    errores: ['Olvidar la palabra «ácido».', 'Contar mal los carbonos de la cadena: el –COOH aporta un C.'],
    isomeria: 'Isómeros de función de los ésteres (C2H4O2: ácido etanoico y metanoato de metilo).',
  },
  {
    familia: 'esteres',
    titulo: 'Ésteres',
    grupo: '–COO–R′',
    sufijo: '-oato de -ilo',
    resumen: 'Derivan de un ácido (parte acilo) y un alcohol (parte alquilo). El nombre tiene dos palabras: «…oato de …ilo».',
    regla: [
      'Parte ácida: la cadena que contiene el C=O (incluido). Se nombra como el ácido pero con «-oato».',
      'Parte alcohol: el grupo unido al oxígeno, como alquilo (metilo, etilo, propilo, isopropilo).',
      'Nombre: [ácido sin «ácido» → -oato] + « de » + [alquilo-ilo].',
    ],
    ejemplos: [
      ej('etanoato de metilo', mk(2, { at: { 1: t('COOCH3') } }), 'Acilo de 2 C (etanoico) + metilo en el O. Nombre tradicional: acetato de metilo.'),
      ej('metanoato de etilo', mk(1, { at: { 0: t('COOC2H5') } }), 'Acilo de 1 C (fórmico) + etilo.'),
      ej('propanoato de etilo', mk(3, { at: { 2: t('COOC2H5') } }), 'Acilo de 3 C + etilo.'),
      ej('butanoato de metilo', mk(4, { at: { 3: t('COOCH3') } }), 'Acilo de 4 C + metilo.'),
    ],
    errores: ['Invertir las partes: la que lleva el C=O se nombra PRIMERO.', 'Confundirlo con un éter o un ácido isómero.'],
    isomeria: 'Isómeros de función de los ácidos carboxílicos con el mismo número de C y O.',
  },
  {
    familia: 'aminas',
    titulo: 'Aminas',
    grupo: '–NH2 (primaria), –NHR (secundaria), –NR2 (terciaria)',
    sufijo: '-amina (prefijo: amino-)',
    resumen: 'Derivan del amoníaco. Se clasifican por cuántos carbonos están unidos al nitrógeno.',
    regla: [
      'Amina primaria: cadena + «-amina» (etano → etanamina; curso: etilamina).',
      'Amina secundaria o terciaria: la cadena más larga es la principal; los otros grupos van como sustituyentes sobre el N con el locante «N-».',
      'Dos iguales: «N,N-dimetil…».',
    ],
    ejemplos: [
      ej('etanamina', mk(2, { at: { 1: s('NH2') } }), 'Amina primaria de 2 C.'),
      ej('propan-2-amina', mk(3, { at: { 1: s('NH2') } }), 'Primaria, con el N en C2.'),
      ej('N-metiletanamina', mk(2, { at: { 1: s('NHCH3') } }), 'Secundaria: el metilo sobre el N lleva el locante «N».'),
      ej('N,N-dimetiletanamina', mk(2, { at: { 1: s('N(CH3)2') } }), 'Terciaria: dos metilos sobre el nitrógeno.'),
    ],
    errores: ['Olvidar la «N-» al ubicar el grupo sobre el nitrógeno.', 'Confundir amina con amida (la amida tiene C=O).'],
    isomeria: 'C3H9N: propan-1-amina, propan-2-amina, N-metiletanamina y N,N-dimetilmetanamina (de cadena, posición y función entre primaria/secundaria/terciaria).',
  },
  {
    familia: 'amidas',
    titulo: 'Amidas',
    grupo: '–CONH2',
    sufijo: '-amida (prefijo: carbamoil-)',
    resumen: 'Derivan de un ácido: el –OH del –COOH se reemplaza por –NH2. El C del –CONH2 es C1.',
    regla: ['Cambiá la «o» final de la cadena por «-amida».', 'El C del grupo es C1: sin locante.'],
    ejemplos: [
      ej('etanamida', mk(2, { at: { 0: t('CONH2') } }), 'Deriva del ácido etanoico.'),
      ej('propanamida', mk(3, { at: { 0: t('CONH2') } }), 'Deriva del ácido propanoico.'),
      ej('2-metilpropanamida', mk(3, { at: { 0: t('CONH2'), 1: s('CH3') } }), 'Rama en C2 contando desde el grupo amida.'),
    ],
    errores: ['Escribir «amina» en vez de «amida».', 'Olvidar que el C del grupo cuenta en la cadena.'],
    isomeria: 'Una amida y una amina con C=O en otra posición pueden ser isómeros de función.',
  },
  {
    familia: 'nitrilos',
    titulo: 'Nitrilos',
    grupo: '–C≡N',
    sufijo: '-nitrilo (prefijo: ciano-)',
    resumen: 'El carbono del –CN también es parte de la cadena (C1).',
    regla: ['Se agrega «nitrilo» al nombre del alcano con el mismo número de C (incluyendo el C del –CN).', 'Sin locante para el –CN.'],
    ejemplos: [
      ej('etanonitrilo', mk(2, { at: { 0: t('CN') } }), 'Cadena de 2 C: el CH3 y el C del –CN.'),
      ej('propanonitrilo', mk(3, { at: { 0: t('CN') } }), 'Cadena de 3 C.'),
      ej('butanonitrilo', mk(4, { at: { 0: t('CN') } }), 'Cadena de 4 C.'),
    ],
    errores: ['No contar el C del ciano dentro de la cadena.', 'Escribir «cianuro de …»: es otra nomenclatura (radicofuncional).'],
    isomeria: 'Los nitrilos tienen como isómeros de función a los isonitrilos (R–NC), que acá no se trabajan.',
  },
]

// ── Secciones generales ──────────────────────────────────────────────────────────────
// Bloques: { t: 'p', x } · { t: 'ul', items } · { t: 'tabla', head, rows } · { t: 'nota', tono: 'tip'|'error', x } · { t: 'pasos', items } · { t: 'ejemplos', items }
export const SECCIONES = [
  {
    id: 'empezar',
    titulo: 'Cómo estudiar con esta app',
    resumen: 'Un recorrido en cuatro pasos para llegar al parcial entrenado.',
    bloques: [
      {
        t: 'pasos',
        items: [
          'Leé una sección del manual (fundamentos → método → una familia) y marcala como estudiada.',
          'Armá los ejemplos con «Armar en el Constructor» y mirá cómo cambia el nombre cuando movés un grupo.',
          'Hacé una Práctica de esa familia con corrección inmediata.',
          'Cuando te sientas seguro, probá un Simulacro (sin ayudas) con las hojas de tu curso y mirá la nota.',
        ],
      },
      { t: 'nota', tono: 'tip', x: 'Estudiar nomenclatura es sobre todo hacer ejercicios: el 80 % del tiempo en el Constructor y la Práctica, el 20 % leyendo.' },
    ],
  },
  {
    id: 'fundamentos',
    titulo: 'Fundamentos',
    resumen: 'Hibridación, tipos de carbono y de fórmulas.',
    bloques: [
      {
        t: 'tabla',
        head: ['Hibridación', 'Enlaces del C', 'Ángulo', 'Geometría', 'Ejemplo'],
        rows: [
          ['sp³', '4 simples (σ)', '109,5°', 'tetraédrica', 'CH4, alcanos'],
          ['sp²', '1 doble + 2 simples', '120°', 'trigonal plana', 'C=C, C=O'],
          ['sp', '1 triple + 1 simple (o 2 dobles)', '180°', 'lineal', 'C≡C, C≡N'],
        ],
      },
      {
        t: 'ul',
        items: [
          'Carbono primario: unido a 1 solo carbono. Secundario: a 2. Terciario: a 3. Cuaternario: a 4.',
          'Fórmula molecular: sólo cuántos átomos de cada elemento (C3H8O).',
          'Fórmula semidesarrollada: muestra los grupos y la conectividad (CH3-CH(OH)-CH3). Es la que usás en el parcial.',
          'Fórmula desarrollada: todos los enlaces y átomos dibujados.',
          'Cada C debe tener 4 enlaces en total: es la forma más rápida de detectar un error.',
        ],
      },
      {
        t: 'tabla',
        head: ['Serie', 'Fórmula general', 'Enlaces'],
        rows: [
          ['Alcanos', 'CnH2n+2', 'simples'],
          ['Alquenos', 'CnH2n', '1 doble'],
          ['Alquinos', 'CnH2n−2', '1 triple'],
        ],
      },
    ],
  },
  {
    id: 'metodo',
    titulo: 'El método de 5 pasos',
    resumen: 'La receta que sirve para cualquier compuesto.',
    bloques: [
      {
        t: 'pasos',
        items: [
          'Identificá el grupo funcional PRINCIPAL (el de mayor prioridad en la tabla de la sección «Prioridad de grupos»).',
          'Buscá la cadena principal: continua, con el grupo principal y, si hay empate, con más insaturaciones y luego más larga.',
          'Numerá desde el extremo que dé el menor locante al grupo principal; después a los enlaces múltiples; después a los sustituyentes.',
          'Nombrá los sustituyentes en orden alfabético (di-, tri-, tetra- no cuentan para ordenar).',
          'Armá: [sustituyentes] + [raíz] + [insaturaciones] + [sufijo principal].',
        ],
      },
      {
        t: 'tabla',
        head: ['C', 'Raíz', 'C', 'Raíz', 'Multiplicador', 'Cantidad'],
        rows: [
          ['1', 'met-', '6', 'hex-', 'di-', '2'],
          ['2', 'et-', '7', 'hept-', 'tri-', '3'],
          ['3', 'prop-', '8', 'oct-', 'tetra-', '4'],
          ['4', 'but-', '9', 'non-', 'penta-', '5'],
          ['5', 'pent-', '10', 'dec-', 'hexa-', '6'],
        ],
      },
      {
        t: 'ul',
        items: [
          'Locantes: números separados por comas (2,3), y guiones entre números y letras (2,3-dimetil).',
          'Estilo del curso: 2-pentanona, 2-penteno, 3-metil-2-pentanona. Estilo IUPAC 2013: pentan-2-ona, pent-2-eno, 3-metilpentan-2-ona. La app acepta los dos.',
          'La «o» final de la raíz se elimina si el sufijo empieza con vocal (pentano + ol → pentanol, pero pentano + diol → pentanodiol).',
        ],
      },
      { t: 'nota', tono: 'error', x: 'Error clásico: numerar desde el extremo «natural» o más cómodo. Siempre gana el que da menor locante al grupo principal.' },
    ],
  },
  {
    id: 'ramas',
    titulo: 'Sustituyentes y ramificaciones',
    resumen: 'Alquilos, halógenos y cómo ordenarlos.',
    bloques: [
      {
        t: 'tabla',
        head: ['Sustituyente', 'Fórmula', 'Nombre como prefijo'],
        rows: [
          ['Metilo', '–CH3', 'metil'],
          ['Etilo', '–CH2CH3', 'etil'],
          ['Propilo', '–CH2CH2CH3', 'propil'],
          ['Isopropilo', '–CH(CH3)2', 'isopropil'],
          ['Hidroxi / amino / oxo', '–OH / –NH2 / =O', 'hidroxi / amino / oxo'],
          ['Metoxi / etoxi', '–OCH3 / –OC2H5', 'metoxi / etoxi'],
          ['Flúor, cloro, bromo, yodo', '–F, –Cl, –Br, –I', 'fluoro, cloro, bromo, yodo'],
        ],
      },
      {
        t: 'ejemplos',
        items: [
          ej('3-etil-2-metilpentano', mk(5, { at: { 1: s('CH3'), 2: s('C2H5') } }), 'Orden alfabético: «etil» antes que «metil», aunque el metilo tenga menor locante.'),
          ej('2-cloro-3-metilbutano', mk(4, { at: { 1: s('Cl'), 2: s('CH3') } }), 'Alfabético: «cloro» antes que «metil».'),
        ],
      },
      { t: 'nota', tono: 'tip', x: 'En el Constructor, una rama de n carbonos sólo cabe si deja una cadena principal al menos igual de larga: así se evita elegir mal la cadena.' },
    ],
  },
  // ← acá se insertan las familias (ver `buildSections`)
  {
    id: 'prioridad',
    titulo: 'Prioridad de grupos funcionales',
    resumen: 'Quién es el grupo principal cuando hay más de uno.',
    dinamica: 'prioridad',
    bloques: [
      { t: 'p', x: 'Si hay varios grupos, el de mayor prioridad (número más bajo) es el principal y define el sufijo. Los demás se nombran como prefijos.' },
      {
        t: 'ejemplos',
        items: [
          ej('ácido 3-hidroxibutanoico', mk(4, { at: { 0: t('COOH'), 2: s('OH') } }), 'Ácido (1) > alcohol (7): «ácido …oico» y el –OH pasa a prefijo «hidroxi».'),
          ej('4-hidroxibutan-2-ona', mk(4, { at: { 1: s('oxo'), 3: s('OH') } }), 'Cetona (6) > alcohol (7).'),
          ej('3-aminobutan-2-ol', mk(4, { at: { 1: s('OH'), 2: s('NH2') } }), 'Alcohol (7) > amina (8): «-ol» y «amino» como prefijo.'),
        ],
      },
    ],
  },
  {
    id: 'isomeria',
    titulo: 'Isomería',
    resumen: 'Misma fórmula molecular, distinta estructura.',
    bloques: [
      {
        t: 'tabla',
        head: ['Tipo', 'Qué cambia', 'Ejemplo (C4H10O)'],
        rows: [
          ['De cadena', 'El esqueleto carbonado', 'butan-1-ol / 2-metilpropan-1-ol'],
          ['De posición', 'Dónde está el grupo o el enlace múltiple', 'butan-1-ol / butan-2-ol'],
          ['De función', 'El grupo funcional', 'butan-1-ol / etoxietano'],
          ['Geométrica (E/Z)', 'Disposición alrededor del C=C', '(E)-but-2-eno / (Z)-but-2-eno'],
        ],
      },
      {
        t: 'ul',
        items: [
          'Alcohol ⇄ éter · Aldehído ⇄ cetona · Ácido ⇄ éster · Amina primaria ⇄ secundaria ⇄ terciaria.',
          'Para que haya E/Z, cada carbono del doble enlace debe tener dos sustituyentes DISTINTOS.',
        ],
      },
      { t: 'nota', tono: 'tip', x: 'Ejercicio: en el Constructor armá C3H8O de tres formas distintas y fijate que el nombre cambia aunque la fórmula molecular no.' },
    ],
  },
  {
    id: 'checklist',
    titulo: 'Checklist para el parcial',
    resumen: 'Qué revisar antes de entregar.',
    bloques: [
      {
        t: 'ul',
        items: [
          '¿Elegí el grupo principal correcto según la prioridad?',
          '¿La cadena es la más larga que lo contiene?',
          '¿Numeré para el menor locante del grupo principal, luego insaturaciones, luego ramas?',
          '¿Ordené los prefijos alfabéticamente (sin contar di-, tri-)?',
          '¿Cada carbono tiene 4 enlaces al armar la estructura?',
          '¿El C del –CHO, –COOH, –CONH2, –CN, –COO– cuenta como carbono de la cadena?',
          '¿Escribí «ácido» o «de …ilo» cuando correspondía?',
          '¿Los locantes están separados por comas y los números de las letras por guiones?',
        ],
      },
    ],
  },
]

/** Lista final de secciones del manual, con las familias intercaladas antes de «Prioridad». */
export function buildSections() {
  const fam = FAMILIAS_MANUAL.map((f) => ({ id: `fam-${f.familia}`, familia: f.familia, titulo: f.titulo, resumen: f.resumen, f }))
  const i = SECCIONES.findIndex((x) => x.id === 'prioridad')
  return [...SECCIONES.slice(0, i), ...fam, ...SECCIONES.slice(i)]
}

/** Todos los ejemplos con su nombre declarado (para pruebas). */
export function allManualExamples() {
  const out = []
  for (const f of FAMILIAS_MANUAL) f.ejemplos.forEach((e) => out.push({ where: f.familia, ...e }))
  for (const sec of SECCIONES) for (const b of sec.bloques) if (b.t === 'ejemplos') b.items.forEach((e) => out.push({ where: sec.id, ...e }))
  return out
}
