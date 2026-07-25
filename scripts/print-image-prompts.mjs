// Prints the tile image pack brief as a paste-ready list.
//   npm run images:prompts          -> numbered list, 6 variants per signature
//   npm run images:prompts -- 10    -> ask for 10 variants each
//
// Generate the images anywhere you like, save them into src/assets/tiles/ under
// the filenames shown, and they are picked up automatically on the next build.
import { PROMPTS, STYLE, REQUIRED_SIGNATURES, IMAGES, fileNameFor } from '../src/game/images.manifest.js'

const perSignature = Number(process.argv[2]) || 6

console.log('=== TILE IMAGE PACK ===\n')
console.log('Shared style (prepend to every prompt):')
console.log('  ' + STYLE + '\n')
console.log(`Generate ${perSignature} variants per item — different streets, angles and light,`)
console.log('so a grid of the same category does not look copy-pasted.\n')
console.log('Save each result into  src/assets/tiles/  using the filename pattern given.')
console.log('The filename is what tells the game what the picture shows, so it has to')
console.log('be right: a mislabelled file silently breaks the rule that reads it.\n')

let n = 0
for (const sig of REQUIRED_SIGNATURES) {
  n++
  const have = (IMAGES[sig] || []).length
  const trap = /dont|occupied|shuttle|:right$|yellow|green/.test(sig) ? '   [trap/decoy]' : ''
  console.log(`${String(n).padStart(2, ' ')}. ${sig}${trap}`)
  console.log(`    prompt: ${PROMPTS[sig]}, ${STYLE}`)
  console.log(`    save as: ${fileNameFor(sig, 1)} … ${fileNameFor(sig, perSignature)}`)
  console.log(`    have: ${have === 0 ? 'none yet (placeholder art in use)' : have + ' file(s)'}\n`)
}

console.log('Two rules that matter more than the rest:')
console.log('  • light:red and light:green must be MATCHED PAIRS — same pole, same')
console.log('    framing, only the lamp differs. Tier III+ cross-fades between them,')
console.log('    so a mismatched pair reads as the tile teleporting.')
console.log('  • hydrant:left / hydrant:right must both show the POLE. The side of the')
console.log('    pole is the entire rule; without it the round is unwinnable.\n')
console.log(`Total: ${REQUIRED_SIGNATURES.length} signatures × ${perSignature} = ${REQUIRED_SIGNATURES.length * perSignature} images.`)
