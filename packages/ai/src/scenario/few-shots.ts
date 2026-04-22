export const SCENARIO_FEW_SHOTS = `Here are 3 examples of the target output quality:

EXAMPLE 1 — Minimalist skincare brand with sage/cream palette and natural light references:
{
  "creativeDirection": "A skincare line rooted in morning ritual. Visual language favors stillness, 9am window light, tactile natural materials. Products are protagonists, never accessories — no clutter, no lifestyle staging that steals focus.",
  "moodKeywords": ["morning ritual", "quiet luxury", "tactile materials", "diffused daylight", "slow pace"],
  "surfaceLibrary": ["unpolished travertine counter with faint grey veining", "folded natural linen slightly wrinkled", "pale oak wood with visible grain", "ceramic tile in warm off-white", "raw plaster wall background", "cream silk-satin folds"],
  "lightingTokens": ["soft 9am window diffusion through sheer linen curtain", "overcast daylight with gentle falloff", "warm golden hour spilling from camera-left", "indirect north-facing studio light"],
  "colorGrading": "warm cream base with desaturated sage green and faint terracotta accents",
  "avoidList": ["clinical fluorescent", "high-saturation neons", "harsh specular highlights", "busy props", "visible brand logos in background", "plastic props"],
  "sceneVariantsByStyle": {
    "social_style": [
      {"id":"morning-counter","headline":"Morning ritual on travertine","surface":"unpolished travertine counter with faint grey veining","lighting":"soft 9am window diffusion through sheer linen curtain","angle":"3/4","composition":"rule-of-thirds-right","propsOrContext":"half-folded linen washcloth off to left, faint ceramic cup blur","referenceAnchor":"inspired by reference 1 — its diffused window light and stillness"},
      {"id":"oak-overhead","headline":"Oak desk flat-lay","surface":"pale oak wood with visible grain","lighting":"overcast daylight with gentle falloff","angle":"overhead","composition":"centered","propsOrContext":"single pressed leaf, small empty ceramic bowl","referenceAnchor":"inspired by reference 2 — overhead linen aesthetic"},
      {"id":"silk-evening","headline":"Silk at golden hour","surface":"cream silk-satin folds","lighting":"warm golden hour spilling from camera-left","angle":"eye-level","composition":"negative-space-top","propsOrContext":"nothing else, fabric as primary texture","referenceAnchor":"inspired by reference 3 — warmth without clutter"}
    ],
    "editorial_hero": [
      {"id":"seamless-cream","headline":"Seamless cream catalog","surface":"warm cream seamless paper","lighting":"indirect north-facing studio light","angle":"eye-level","composition":"centered","propsOrContext":"none","referenceAnchor":"reference 1 palette match"},
      {"id":"travertine-hero","headline":"Travertine slab hero","surface":"unpolished travertine counter with faint grey veining","lighting":"soft side-key with subtle fill","angle":"hero","composition":"negative-space-top","propsOrContext":"single shadow line","referenceAnchor":"reference 2 material echo"},
      {"id":"plaster-profile","headline":"Plaster wall profile","surface":"raw plaster wall background","lighting":"overcast daylight with gentle falloff","angle":"side","composition":"rule-of-thirds-left","propsOrContext":"none","referenceAnchor":"reference 3 — muted warmth"}
    ],
    "cgi_concept": [
      {"id":"cloud-float","headline":"Floating in pastel cloud","surface":"suspended in cream-toned cumulus cloud formation","lighting":"volumetric god-rays through cloud layers","angle":"hero","composition":"centered","propsOrContext":"cloud formations surround at oversized scale","referenceAnchor":"none — CGI original"},
      {"id":"silk-flow","headline":"Silk ribbon suspension","surface":"wrapped mid-flow in cream silk ribbon","lighting":"soft rim light with inner glow","angle":"3/4","composition":"diagonal-dynamic","propsOrContext":"silk ribbons frozen mid-movement","referenceAnchor":"material echo of reference 3"},
      {"id":"geo-nest","headline":"Crystalline geometry nest","surface":"nested inside translucent crystalline geometric structure","lighting":"iridescent caustic refractions","angle":"low","composition":"symmetrical","propsOrContext":"faceted glass surfaces refract warm golden light","referenceAnchor":"none — CGI original"}
    ]
  },
  "recommendedMix": {
    "primaryStyle": "editorial_hero",
    "secondaryStyle": "social_style",
    "reasoning": "Editorial Hero establishes brand authority on catalog and site. Social adds warmth for the feed."
  }
}

EXAMPLE 2 — Bold color makeup brand with maximalist chromatic references:
{
  "creativeDirection": "A color cosmetics line that celebrates saturation. Visuals lean into chromatic abundance — products sit on bold monochrome backgrounds or against scale-distorted graphic surfaces. Nothing muted, nothing apologetic.",
  "moodKeywords": ["saturated color", "graphic boldness", "pop-art influence", "chromatic contrast"],
  "surfaceLibrary": ["glossy scarlet red plexiglass surface", "matte cobalt blue poster paper", "high-gloss chartreuse yellow seamless", "velvet fuchsia fabric with deep pile", "oversized graphic print checkerboard black-white", "gradient sunset-orange-to-pink seamless"],
  "lightingTokens": ["hard single-source flash with crisp shadow", "colored gel backlight magenta", "double-light setup warm key + cool fill", "ring-light direct frontal"],
  "colorGrading": "high-saturation jewel tones dominated by scarlet, cobalt, chartreuse with deliberate contrast",
  "avoidList": ["muted pastels", "beige neutrals", "natural wood surfaces", "soft diffused light", "quiet aesthetics", "minimalist restraint"],
  "sceneVariantsByStyle": {
    "social_style": [
      {"id":"scarlet-mirror","headline":"Scarlet selfie vibe","surface":"glossy scarlet red plexiglass surface","lighting":"hard single-source flash with crisp shadow","angle":"overhead","composition":"diagonal-dynamic","propsOrContext":"reflection of product in glossy surface, nothing else","referenceAnchor":"reference 1 — bold flash aesthetic"},
      {"id":"cobalt-grid","headline":"Cobalt poster grid","surface":"matte cobalt blue poster paper","lighting":"ring-light direct frontal","angle":"eye-level","composition":"rule-of-thirds-left","propsOrContext":"geometric sticker off to right for scale","referenceAnchor":"reference 2 graphic energy"},
      {"id":"checker-chaos","headline":"Checkerboard pop","surface":"oversized graphic print checkerboard black-white","lighting":"hard flash with visible shadow","angle":"3/4","composition":"centered","propsOrContext":"single neon element for color pop","referenceAnchor":"reference 3 — graphic clash"}
    ],
    "editorial_hero": [
      {"id":"chartreuse-hero","headline":"Chartreuse catalog","surface":"high-gloss chartreuse yellow seamless","lighting":"double-light setup warm key + cool fill","angle":"hero","composition":"centered","propsOrContext":"none","referenceAnchor":"reference 2 palette"},
      {"id":"gradient-drop","headline":"Sunset gradient drop","surface":"gradient sunset-orange-to-pink seamless","lighting":"soft key with colored fill","angle":"eye-level","composition":"negative-space-top","propsOrContext":"none","referenceAnchor":"reference 1 chromatic warmth"},
      {"id":"fuchsia-velvet","headline":"Velvet fuchsia platform","surface":"velvet fuchsia fabric with deep pile","lighting":"colored gel backlight magenta","angle":"low","composition":"centered","propsOrContext":"none","referenceAnchor":"reference 3 texture sensuality"}
    ],
    "cgi_concept": [
      {"id":"color-explosion","headline":"Pigment explosion","surface":"suspended mid-explosion of colored pigment powder","lighting":"hard flash freezes pigment cloud","angle":"hero","composition":"centered","propsOrContext":"jewel-tone powder in slow-motion burst","referenceAnchor":"none — CGI original"},
      {"id":"liquid-splash","headline":"Liquid color splash","surface":"emerging from chromatic liquid splash","lighting":"crisp specular highlights on liquid","angle":"3/4","composition":"diagonal-dynamic","propsOrContext":"liquid droplets frozen mid-splash","referenceAnchor":"none — CGI original"},
      {"id":"chrome-nest","headline":"Chrome geometric cradle","surface":"cradled in reflective chrome geometric form","lighting":"volumetric colored lights reflecting in chrome","angle":"low","composition":"symmetrical","propsOrContext":"chrome surfaces mirror surrounding color wash","referenceAnchor":"none — CGI original"}
    ]
  },
  "recommendedMix": {
    "primaryStyle": "social_style",
    "secondaryStyle": "cgi_concept",
    "reasoning": "Social drives discovery for a color brand. CGI creates stop-scroll moments for virality. Editorial secondary for catalog."
  }
}

EXAMPLE 3 — Natural haircare with warm wooden tones and botanical references:
{
  "creativeDirection": "A haircare brand built around botanical ingredients and wooden textures. Shots feel sun-dappled and outdoor-adjacent without becoming literal nature photography. Products rest on warm wood or sit amid dried florals — never forests, never gardens.",
  "moodKeywords": ["sun-dappled", "botanical accents", "warm wood", "ingredient-forward", "late-afternoon"],
  "surfaceLibrary": ["aged walnut wood with deep grain", "rattan flat weave mat", "dried pampas grass bundle surface", "cream ceramic with subtle glaze drips", "pressed flower arrangement on parchment", "raw-hewn teak slab edge"],
  "lightingTokens": ["late afternoon sun through blind-slats creating strokes of light", "warm dappled light filtered through leaves", "low-angle golden hour side-key", "soft overcast with warm tone bounce"],
  "colorGrading": "warm amber base with olive greens and dried rose accents",
  "avoidList": ["harsh fluorescent", "blue cool tones", "plastic surfaces", "cluttered kitchen scenes", "actual outdoor forest photography", "glossy modern surfaces"],
  "sceneVariantsByStyle": {
    "social_style": [
      {"id":"walnut-dappled","headline":"Walnut with sun stripes","surface":"aged walnut wood with deep grain","lighting":"late afternoon sun through blind-slats creating strokes of light","angle":"3/4","composition":"rule-of-thirds-left","propsOrContext":"faint blur of dried eucalyptus sprig","referenceAnchor":"reference 1 sun-dappled quality"},
      {"id":"rattan-overhead","headline":"Rattan flat-lay","surface":"rattan flat weave mat","lighting":"soft overcast with warm tone bounce","angle":"overhead","composition":"centered","propsOrContext":"single pressed fern frond","referenceAnchor":"reference 2 textile texture"},
      {"id":"pampas-bed","headline":"Resting on pampas","surface":"dried pampas grass bundle surface","lighting":"low-angle golden hour side-key","angle":"hero","composition":"negative-space-top","propsOrContext":"nothing else, grass is texture","referenceAnchor":"reference 3 botanical echo"}
    ],
    "editorial_hero": [
      {"id":"teak-slab","headline":"Teak slab catalog","surface":"raw-hewn teak slab edge","lighting":"warm dappled light filtered through leaves","angle":"eye-level","composition":"centered","propsOrContext":"none","referenceAnchor":"reference 1 wood hero"},
      {"id":"parchment-press","headline":"Pressed flower parchment","surface":"pressed flower arrangement on parchment","lighting":"soft overcast with warm tone bounce","angle":"overhead","composition":"symmetrical","propsOrContext":"none","referenceAnchor":"reference 3 botanical catalog"},
      {"id":"ceramic-glaze","headline":"Cream ceramic drip","surface":"cream ceramic with subtle glaze drips","lighting":"late afternoon golden side-key","angle":"hero","composition":"negative-space-bottom","propsOrContext":"none","referenceAnchor":"reference 2 artisan tactility"}
    ],
    "cgi_concept": [
      {"id":"botanical-swarm","headline":"Botanical elements swarm","surface":"surrounded by oversized dried botanical elements","lighting":"warm dappled light through botanical veils","angle":"hero","composition":"centered","propsOrContext":"eucalyptus and pampas grass at giant scale","referenceAnchor":"none — CGI original"},
      {"id":"honey-suspension","headline":"Suspended in amber honey","surface":"suspended in slow-motion amber honey drip","lighting":"backlit through amber liquid","angle":"3/4","composition":"diagonal-dynamic","propsOrContext":"amber liquid frozen mid-flow","referenceAnchor":"none — CGI original"},
      {"id":"wood-geometry","headline":"Wooden geometric nest","surface":"nested in warm geometric wood sculpture","lighting":"volumetric warm light through wood slats","angle":"low","composition":"symmetrical","propsOrContext":"wooden slats form protective cradle","referenceAnchor":"none — CGI original"}
    ]
  },
  "recommendedMix": {
    "primaryStyle": "editorial_hero",
    "secondaryStyle": "social_style",
    "reasoning": "Editorial establishes ingredient authority. Social drives discovery through warm daylight shots."
  }
}`;
