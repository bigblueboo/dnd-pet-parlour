import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const toolRoot = path.resolve(repoRoot, '..', 'genai-tools');
const outputRoot = path.join(repoRoot, 'public', 'generated');
const monstersDir = path.join(outputRoot, 'monsters');
const heroesDir = path.join(outputRoot, 'heroes');
const backgroundsDir = path.join(outputRoot, 'backgrounds');

mkdirSync(monstersDir, { recursive: true });
mkdirSync(heroesDir, { recursive: true });
mkdirSync(backgroundsDir, { recursive: true });

function creaturePortraitPrompt(subject, details) {
  return `${subject}, full creature portrait, centered subject, fantasy bestiary illustration, richly rendered anatomy, dramatic rim light, natural pose, isolated on solid chroma matte background for cutout, no frame, no text, no logo, ${details}`;
}

function heroPortraitPrompt(subject, details) {
  return `${subject}, full character portrait, fantasy RPG concept art, head-to-toe figure, clear silhouette, detailed costume and gear, grounded anatomy, expressive face, isolated on solid chroma matte background for cutout, no frame, no text, no logo, ${details}`;
}

const monsterPrompts = [
  ['angry_sheep', creaturePortraitPrompt('Angry Sheep', 'stubborn ram with cracked brass bell, coarse wool, lowered horns, farm guardian attitude, earthy realism')],
  ['pet_rat', creaturePortraitPrompt('Pet Rat', 'scrappy domesticated rat with alert whiskers, street survivor energy, glossy fur, nimble paws')],
  ['gelatinous_cube', creaturePortraitPrompt('Gelatinous Cube', 'transparent ooze with suspended bones and scraps, translucent membranes, eerie dungeon realism')],
  ['stirge', creaturePortraitPrompt('Stirge', 'winged bloodsucking horror with hooked legs and needle proboscis, leathery wings, predatory pose')],
  ['blink_dog', creaturePortraitPrompt('Blink Dog', 'fey hound with blue-white teleport shimmer, intelligent eyes, athletic canine stance')],
  ['skeleton_squire', creaturePortraitPrompt('Skeleton Squire', 'animated skeleton retainer with dented shield and rusted short sword, disciplined posture')],
  ['mimic', creaturePortraitPrompt('Mimic', 'monstrous treasure chest with teeth and pseudopods, ambush tension, sticky saliva')],
  ['goblin', creaturePortraitPrompt('Goblin', 'small green skirmisher with knife and scavenged leathers, sharp grin, wiry energy')],
  ['zombie', creaturePortraitPrompt('Zombie', 'rotting undead shambling brute, exposed sinew, muddy grave-clothes, relentless stare')],
  ['owlbear', creaturePortraitPrompt('Owlbear', 'massive owl-bear hybrid, heavy claws, feathered mane, feral intensity')],
  ['ochre_jelly', creaturePortraitPrompt('Ochre Jelly', 'mustard-colored acidic ooze, heavy dripping mass, dungeon horror realism')],
  ['harpy', creaturePortraitPrompt('Harpy', 'winged monstrous woman with ragged feathers, taloned feet, predatory beauty, cliff-hunter menace')],
  ['imp', creaturePortraitPrompt('Imp', 'small red fiend with barbed tail, sly grin, leathery wings, infernal mischief')],
  ['displacer_beast', creaturePortraitPrompt('Displacer Beast', 'sleek six-legged panther-like predator with barbed tentacles, ghostly displacement shimmer')],
  ['black_pudding', creaturePortraitPrompt('Black Pudding', 'jet-black corrosive slime, glossy surface, devouring ooze terror, dungeon acidity')],
  ['rust_monster', creaturePortraitPrompt('Rust Monster', 'insectoid metal-devouring beast with arched back and sensitive antennae, scavenger menace')],
  ['hippogriff', creaturePortraitPrompt('Hippogriff', 'noble eagle-horse hybrid with hooked beak, powerful wings, proud posture, alpine fantasy realism')],
  ['hell_hound_pup', creaturePortraitPrompt('Hell Hound Pup', 'young infernal hound with ember cracks in fur, smoke curling from muzzle, dangerous but juvenile')],
  ['troll', creaturePortraitPrompt('Troll', 'lanky regenerating giant with mossy skin, long claws, brutish posture, ugly ferocity')],
  ['mind_flayer', creaturePortraitPrompt('Mind Flayer', 'illithid with flowing robes, tentacled face, psionic glow, sinister calm')],
  ['wyvern', creaturePortraitPrompt('Wyvern', 'venomous draconic beast with two wings, barbed tail stinger, mountain predator silhouette')],
  ['naga', creaturePortraitPrompt('Naga', 'regal serpent sorcerer with jewel-bright scales, cobra hood, arcane temple menace')],
  ['black_dragon_wyrmling', creaturePortraitPrompt('Black Dragon Wyrmling', 'young black dragon with swamp-slick scales, acid drips, lean body, cruel eyes')],
  ['necromancer', creaturePortraitPrompt('Necromancer', 'dark robed grave mage with ornate staff, funereal elegance, sinister but charismatic presence')],
  ['red_dragon_wyrmling', creaturePortraitPrompt('Red Dragon Wyrmling', 'young crimson dragon with ember-lit scales, smoke from nostrils, arrogant stance')],
  ['frost_giant', creaturePortraitPrompt('Frost Giant', 'towering blue-skinned giant with fur cloak and ice-rimed axe, glacial might')],
  ['dracolich_hatchling', creaturePortraitPrompt('Dracolich Hatchling', 'skeletal baby dragon with necrotic embers in ribcage, brittle bone wings, eerie majesty')],
  ['mummy_lord', creaturePortraitPrompt('Mummy Lord', 'royal undead pharaoh wrapped in ancient linens, glowing eyes, tomb regality')],
  ['beholder', creaturePortraitPrompt('Beholder', 'floating orb aberration with one giant eye and many eyestalks, magical menace')],
  ['death_knight', creaturePortraitPrompt('Death Knight', 'black-armored undead champion with cursed greatsword, hellfire aura, mounted-warrior menace')],
  ['tarrasque', creaturePortraitPrompt('Tarrasque', 'colossal apocalyptic reptilian titan, jagged plates, monstrous maw, mythic scale implied in composition')],
];

const heroPrompts = [
  ['mosquito', creaturePortraitPrompt('Mosquito', 'oversized mosquito, fragile legs, translucent wings, annoying precision, tiny but threatening')],
  ['pet_rat', creaturePortraitPrompt('Heroic Pet Rat', 'rescued rat with bright eyes, patched collar, brave stance, scrappy defender energy')],
  ['angry_sheep', creaturePortraitPrompt('Angry Sheep', 'territorial sheep with polished bell and determined glare, pastoral guardian vibe')],
  ['militia_recruit', heroPortraitPrompt('Militia Recruit', 'young town militia member with spear and padded armor, earnest nerves, village heroism')],
  ['hedge_mage', heroPortraitPrompt('Hedge Mage', 'village spellcaster in patched robes, homemade focus charm, practical magic, determined face')],
  ['shrine_cleric', heroPortraitPrompt('Shrine Cleric', 'junior battle priest with mace and travel icon, humble vestments, stern devotion')],
  ['town_guard', heroPortraitPrompt('Town Guard', 'human city watchman with spear and shield, plain tabard, practical armor, lawful demeanor')],
  ['lantern_acolyte', heroPortraitPrompt('Lantern Acolyte', 'young temple acolyte with lantern and mace, humble robes over light armor, radiant conviction')],
  ['ranger_scout', heroPortraitPrompt('Ranger Scout', 'wilderness tracker with longbow, layered leathers, travel cloak, sharp observant expression')],
  ['squire_captain', heroPortraitPrompt('Squire Captain', 'young knightly officer in polished mail with longsword, earnest and brave')],
  ['apprentice_mage', heroPortraitPrompt('Apprentice Mage', 'bookish spellcaster with arcane tome and spell focus, apprentice robes, focused intelligence')],
  ['temple_hound', creaturePortraitPrompt('Temple Hound', 'holy war dog with ceremonial barding, vigilant eyes, disciplined stance')],
  ['griffon_rider', heroPortraitPrompt('Griffon Rider', 'aerial lancer with feathered cloak, riding harness gear, city guard brass details, heroic confidence')],
  ['witch_hunter_captain', heroPortraitPrompt('Witch Hunter Captain', 'grim monster hunter in long coat with silvered crossbow, stern resolve, disciplined menace')],
  ['druid_warden', heroPortraitPrompt('Druid Warden', 'forest guardian with antlered mantle, carved staff, moss and bark details, stern wisdom')],
  ['alchemical_inquisitor', heroPortraitPrompt('Alchemical Inquisitor', 'holy investigator with bomb satchel, brass vials, plated coat, purging zeal')],
  ['paladin_errant', heroPortraitPrompt('Paladin Errant', 'oathsworn holy knight in radiant armor with greatsword, resolute stance, noble bearing')],
  ['battle_mage_marshal', heroPortraitPrompt('Battle Mage Marshal', 'arcane field commander with war staff and officer armor, precise military poise')],
  ['pegasus_knight', heroPortraitPrompt('Pegasus Knight', 'skyborne knight with winged helm and lance, airy banners, celestial cavalry styling')],
  ['sky_lancer', heroPortraitPrompt('Sky Lancer', 'aerial knight duelist with recurved bow and windblown pennant, cloud-swept speed')],
  ['unicorn_guardian', creaturePortraitPrompt('Unicorn Guardian', 'radiant unicorn with luminous mane, woodland grace, sacred authority')],
  ['sacred_lionheart', creaturePortraitPrompt('Sacred Lionheart', 'holy lion champion with gilded mane, celestial armor plates, noble ferocity')],
  ['veteran_cleric', heroPortraitPrompt('Veteran Cleric', 'battle priest in heavy armor with warhammer and holy symbol, seasoned calm, divine resolve')],
  ['silver_banner_templar', heroPortraitPrompt('Silver Banner Templar', 'crusader with polished plate and war banner, ceremonial armor, unstoppable charge energy')],
  ['storm_sorcerer', heroPortraitPrompt('Storm Sorcerer', 'arcane duelist wrapped in wind and lightning, flowing coat, confident smirk, storm magic')],
  ['bladesinger_duelist', heroPortraitPrompt('Bladesinger Duelist', 'elegant elven swordmage with spellwoven rapier, impossible grace, lyrical motion')],
  ['deva_emissary', heroPortraitPrompt('Deva Emissary', 'celestial angelic envoy with glowing wings and longsword, serene judgment, luminous armor')],
  ['phoenix_knight', heroPortraitPrompt('Phoenix Knight', 'heroic knight in ember-bright armor with flaming plume, rebirth symbolism, blazing courage')],
  ['archdruid', heroPortraitPrompt('Archdruid', 'elder nature mage with gnarled staff, layered leaves and bark, ancient wisdom, shapechanger aura')],
  ['couatl_oracle', creaturePortraitPrompt('Couatl Oracle', 'radiant feathered serpent with wise eyes, jewel-toned scales, sacred prophetic aura')],
  ['planetar_guardian', heroPortraitPrompt('Planetar Guardian', 'towering angelic enforcer with immense sword, radiant wings, imposing divine authority')],
  ['dragonlance_prince', heroPortraitPrompt('Dragonlance Prince', 'royal dragonslayer in mirrored armor with immense lance, princely authority, heroic severity')],
  ['gold_dragon_ally', creaturePortraitPrompt('Gold Dragon Ally', 'noble gold dragon with regal horns, wise eyes, radiant scales, benevolent power')],
  ['archmage_sentinel', heroPortraitPrompt('Archmage Sentinel', 'fortress-minded archmage with rune-staff and warding sigils, austere magical authority')],
  ['eladrin_blademaster', heroPortraitPrompt('Eladrin Blademaster', 'fey sword saint with elegant blade, shifting seasonal motifs, impossible grace')],
  ['astral_monk', heroPortraitPrompt('Astral Monk', 'mystic martial artist with cosmic halo and spectral arms, disciplined serenity, starfield aura')],
  ['solar_champion', heroPortraitPrompt('Solar Champion', 'angelic warlord blazing with holy fire, ornate armor, vast wings, overwhelming presence')],
  ['archon_inquisitor', heroPortraitPrompt('Archon Inquisitor', 'celestial magistrate with radiant staff and armored robes, divine judgment, severe expression')],
  ['ancient_treant', creaturePortraitPrompt('Ancient Treant', 'massive walking tree elder with cathedral bark, glowing sap fissures, ancient patience')],
  ['adamantine_champion', heroPortraitPrompt('Adamantine Champion', 'towering armored hero with slab-like hammer, adamant plate, fortress-like stature')],
  ['kirin_herald', creaturePortraitPrompt('Ki-rin Herald', 'heavenly qilin-like beast with luminous mane, cloven hooves, thunderous grace, celestial nobility')],
  ['mythic_ranger', heroPortraitPrompt('Mythic Ranger', 'legendary huntmaster with enchanted longbow and comet-feathered arrows, perfect poise')],
  ['bahamuts_chosen', heroPortraitPrompt("Bahamut's Chosen", 'legendary draconic champion in radiant plate, dragon motifs, sacred spear, supreme confidence')],
  ['sainted_archon', heroPortraitPrompt('Sainted Archon', 'halo-crowned crusader with sanctified blade, celestial regalia, apocalyptic poise')],
  ['tiamat', creaturePortraitPrompt('Tiamat the Dragon Queen', 'five-headed chromatic dragon goddess, terrifying regality, immense wings, apocalyptic power')],
  ['empyrean_exemplar', heroPortraitPrompt('Empyrean Exemplar', 'divine giant champion with storm-wreathed glaive, godlike proportions, thunder and majesty')],
];

const backgroundPrompt =
  'Wide fantasy battle environment, candlelit subterranean arena beneath a monster parlour, carved stone dueling circle, arcane braziers, hanging chains, dramatic smoke and warm torch glow, no characters, no text';

function runImageTool(args) {
  const result = spawnSync('npm', ['run', 'image', '--', ...args], {
    cwd: toolRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function generatePortraits(dir, prompts) {
  for (const [id, prompt] of prompts) {
    runImageTool([
      prompt,
      path.join(dir, `${id}.png`),
      '--remove-bg',
      '--matte-color',
      '#00FF00',
      '--similarity',
      '0.17',
      '--blend',
      '0.09',
    ]);
  }
}

function parseIdList(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }

  return new Set(
    process.argv[index + 1]
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

function filterPrompts(prompts, requestedIds, dir, skipExisting) {
  return prompts.filter(([id]) => {
    if (requestedIds && !requestedIds.has(id)) {
      return false;
    }
    if (skipExisting && existsSync(path.join(dir, `${id}.png`))) {
      return false;
    }
    return true;
  });
}

const requestedMonsterIds = parseIdList('--monsters');
const requestedHeroIds = parseIdList('--heroes');
const skipExisting = process.argv.includes('--skip-existing');
const noBackground = process.argv.includes('--no-background');

generatePortraits(monstersDir, filterPrompts(monsterPrompts, requestedMonsterIds, monstersDir, skipExisting));
generatePortraits(heroesDir, filterPrompts(heroPrompts, requestedHeroIds, heroesDir, skipExisting));
if (!noBackground) {
  runImageTool([backgroundPrompt, path.join(backgroundsDir, 'battle-sanctum.png')]);
}
