import fs from 'node:fs'
import { buildQuestionBank, drawGame, CATEGORIES } from '../src/lib/quiz.js'
const data = JSON.parse(fs.readFileSync(new URL('../src/data/quimica_organica_3d.json', import.meta.url)))
const bank = buildQuestionBank(data)
let bad = 0
for (const q of bank) {
  const uniq = new Set(q.opciones)
  const problems = []
  if (uniq.size !== q.opciones.length) problems.push('opciones duplicadas')
  if (q.opciones.length !== 4) problems.push(`${q.opciones.length} opciones`)
  if (!q.opciones.includes(q.correcta)) problems.push('la correcta no está en las opciones')
  if (!q.pregunta || !q.explicacion) problems.push('falta pregunta/explicación')
  if (problems.length) { bad++; console.log('✗', q.id, problems.join(', ')) }
}
const byCat = {}, bySrc = {}
bank.forEach((q) => { byCat[q.cat] = (byCat[q.cat] ?? 0) + 1; bySrc[q.fuente] = (bySrc[q.fuente] ?? 0) + 1 })
console.log('Banco:', bank.length, 'preguntas', byCat, bySrc)
const game = drawGame(bank, { count: 10 })
console.log('Partida de 10:', game.length, game.map((q) => q.id).join(', '))
for (const cat of CATEGORIES) console.log(cat, drawGame(bank, { count: 10, categories: [cat] }).length)
console.log(bad ? `${bad} preguntas con problemas` : 'Banco OK')
process.exit(bad ? 1 : 0)
