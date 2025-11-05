import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentContent, documentName, language } = await req.json();

    if (!documentContent) {
      return new Response(
        JSON.stringify({ error: language === 'en' ? 'Document content required' : 'Contenu du document requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Document received:', documentName, 'Content length:', documentContent.length);

    const systemPrompt = language === 'en' 
      ? `You are Cuizly, an advanced AI assistant specialized in deeply analyzing and understanding all types of documents including PDFs, Word documents, text files, spreadsheets, presentations, and more.

Your analysis capabilities include:
- Deep content extraction: Read and understand every section, paragraph, table, list, and data point
- Structure recognition: Identify headers, subheaders, sections, chapters, and organizational patterns
- Data interpretation: Extract numbers, statistics, dates, names, locations, and key facts
- Context understanding: Grasp the purpose, audience, and tone of the document
- Language processing: Handle multiple languages and technical terminology

When analyzing documents, provide:
1. **Executive Summary**: Brief overview of what the document contains
2. **Main Content**: Detailed breakdown of key sections and their content
3. **Key Insights**: Important findings, data points, or conclusions
4. **Specific Information**:
   - For menus/recipes: List all dishes, ingredients, prices, preparation methods
   - For reports/documents: Extract facts, figures, recommendations, conclusions
   - For lists/inventories: Organize and categorize all items systematically
   - For contracts/legal: Identify key terms, obligations, dates, parties involved
   - For technical docs: Explain concepts, specifications, instructions
5. **Actionable Recommendations**: Suggest next steps or how to use this information

Be thorough, precise, and conversational. Extract maximum value from every document.`
      : `Tu es Cuizly, un assistant IA avancé spécialisé dans l'analyse approfondie et la compréhension de tous types de documents incluant PDFs, documents Word, fichiers texte, feuilles de calcul, présentations, et plus encore.

Tes capacités d'analyse incluent:
- Extraction profonde du contenu: Lis et comprends chaque section, paragraphe, tableau, liste et point de données
- Reconnaissance de structure: Identifie les titres, sous-titres, sections, chapitres et patterns organisationnels
- Interprétation des données: Extrais les chiffres, statistiques, dates, noms, lieux et faits clés
- Compréhension du contexte: Saisis l'objectif, l'audience et le ton du document
- Traitement linguistique: Gère plusieurs langues et terminologies techniques

Lors de l'analyse de documents, fournis:
1. **Résumé Exécutif**: Aperçu bref du contenu du document
2. **Contenu Principal**: Décomposition détaillée des sections clés et de leur contenu
3. **Insights Clés**: Découvertes importantes, points de données ou conclusions
4. **Informations Spécifiques**:
   - Pour menus/recettes: Liste tous les plats, ingrédients, prix, méthodes de préparation
   - Pour rapports/documents: Extrais faits, chiffres, recommandations, conclusions
   - Pour listes/inventaires: Organise et catégorise tous les éléments systématiquement
   - Pour contrats/légal: Identifie termes clés, obligations, dates, parties impliquées
   - Pour docs techniques: Explique concepts, spécifications, instructions
5. **Recommandations Actionnables**: Suggère les prochaines étapes ou comment utiliser ces informations

Sois minutieux, précis et conversationnel. Extrais la valeur maximale de chaque document.`;

    console.log('Analyzing document with Lovable AI (streaming):', documentName);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: language === 'en' 
              ? `Please analyze this document "${documentName}":\n\n${documentContent.substring(0, 10000)}`
              : `Analyse ce document "${documentName}" s'il te plaît :\n\n${documentContent.substring(0, 10000)}`
          }
        ],
        stream: true
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: language === 'en' ? 'Rate limit exceeded. Please try again later.' : 'Limite de débit dépassée. Veuillez réessayer plus tard.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: language === 'en' ? 'Payment required. Please add credits.' : 'Paiement requis. Veuillez ajouter des crédits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    console.log('Streaming document analysis');

    // Return the stream directly to the client
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error in analyze-document function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
