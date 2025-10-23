import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

// Common strain data (from industry knowledge)
const STRAIN_DATA: Record<string, any> = {
  'peanut butter breath': {
    type: 'hybrid',
    effects: ['Relaxed', 'Sleepy', 'Happy'],
    flavors: ['Nutty', 'Earthy', 'Herbal'],
    description: 'A unique hybrid cross of Do-Si-Dos and Mendo Breath. Known for its nutty, earthy flavor profile and deeply relaxing effects.'
  },
  'gg4': {
    name: 'GG4 (Gorilla Glue #4)',
    type: 'hybrid',
    effects: ['Euphoric', 'Relaxed', 'Happy'],
    flavors: ['Earthy', 'Pungent', 'Pine'],
    description: 'Also known as Gorilla Glue #4, this award-winning hybrid delivers heavy-handed euphoria and relaxation.'
  },
  'gary payton': {
    type: 'hybrid',
    effects: ['Uplifted', 'Energetic', 'Creative'],
    flavors: ['Sweet', 'Fruity', 'Diesel'],
    description: 'Named after the NBA legend, this Cookies strain is a potent hybrid of The Y and Snowman.'
  },
  'apples and bananas': {
    type: 'hybrid',
    effects: ['Happy', 'Relaxed', 'Uplifted'],
    flavors: ['Fruity', 'Sweet', 'Tropical'],
    description: 'A delicious cross bringing together the best of fruity genetics with balanced hybrid effects.'
  },
  'air headz': {
    name: 'Air Headz',
    type: 'hybrid',
    effects: ['Euphoric', 'Uplifted', 'Creative'],
    flavors: ['Sweet', 'Berry', 'Candy'],
    description: 'A candy-like strain with sweet, fruity flavors and uplifting effects.'
  },
  'jet fuel': {
    type: 'hybrid',
    effects: ['Energetic', 'Focused', 'Uplifted'],
    flavors: ['Diesel', 'Pungent', 'Skunk'],
    description: 'High-octane hybrid known for its diesel aroma and energizing effects. Also called G6.'
  },
  'pez runtz': {
    name: 'Pez Runtz',
    type: 'hybrid',
    effects: ['Happy', 'Relaxed', 'Euphoric'],
    flavors: ['Sweet', 'Candy', 'Fruity'],
    description: 'A sweet Runtz phenotype with candy-like flavors reminiscent of the classic Pez candy.'
  },
  'lemon cherry': {
    name: 'Lemon Cherry Runtz',
    type: 'hybrid',
    effects: ['Uplifted', 'Creative', 'Euphoric'],
    flavors: ['Lemon', 'Cherry', 'Sweet'],
    description: 'A flavorful cross combining citrus and cherry notes with balanced hybrid effects.'
  },
  'pink lady': {
    name: 'Pink Lady Runtz',
    type: 'hybrid',
    effects: ['Relaxed', 'Happy', 'Sleepy'],
    flavors: ['Sweet', 'Berry', 'Floral'],
    description: 'A beautiful pink-hued strain with sweet berry flavors and relaxing effects.'
  },
  'lemon runtz': {
    type: 'hybrid',
    effects: ['Uplifted', 'Energetic', 'Happy'],
    flavors: ['Lemon', 'Citrus', 'Sweet'],
    description: 'Citrus-forward Runtz phenotype with bright lemon flavors and uplifting effects.'
  },
  'pink souffle': {
    name: 'Pink Soufflé',
    type: 'hybrid',
    effects: ['Relaxed', 'Happy', 'Euphoric'],
    flavors: ['Sweet', 'Vanilla', 'Creamy'],
    description: 'A dessert strain with sweet, creamy flavors and balanced relaxing effects.'
  },
  'private reserve': {
    type: 'hybrid',
    effects: ['Relaxed', 'Euphoric', 'Happy'],
    flavors: ['Earthy', 'Sweet', 'Pine'],
    description: 'Premium reserve selection with complex terpene profile and potent effects.'
  },
  'project z': {
    name: 'Project Z',
    type: 'hybrid',
    effects: ['Relaxed', 'Sleepy', 'Euphoric'],
    flavors: ['Earthy', 'Herbal', 'Sweet'],
    description: 'An exotic cross delivering deeply relaxing effects with complex flavor.'
  },
  'snoop runtz': {
    name: 'Snoop Runtz',
    type: 'hybrid',
    effects: ['Relaxed', 'Happy', 'Euphoric'],
    flavors: ['Sweet', 'Fruity', 'Candy'],
    description: 'A celebrity-endorsed Runtz phenotype with sweet fruity flavors.'
  },
  'super runtz': {
    type: 'hybrid',
    effects: ['Euphoric', 'Uplifted', 'Creative'],
    flavors: ['Sweet', 'Fruity', 'Candy'],
    description: 'An enhanced Runtz selection with intensified sweet candy flavors and potent effects.'
  },
  'purple slurpee': {
    name: 'Purple Slurpee',
    type: 'indica',
    effects: ['Relaxed', 'Sleepy', 'Happy'],
    flavors: ['Grape', 'Sweet', 'Berry'],
    description: 'A purple-hued indica with grape and berry flavors reminiscent of the frozen drink.'
  },
  'skittlez': {
    name: 'Skittlez',
    type: 'hybrid',
    effects: ['Happy', 'Relaxed', 'Uplifted'],
    flavors: ['Fruity', 'Sweet', 'Tropical'],
    description: 'Taste the rainbow with this colorful strain featuring mixed fruity flavors.'
  },
  'unicorn cherry': {
    name: 'Unicorn Cherry',
    type: 'hybrid',
    effects: ['Euphoric', 'Creative', 'Uplifted'],
    flavors: ['Cherry', 'Sweet', 'Fruity'],
    description: 'A magical strain with sweet cherry flavors and uplifting euphoric effects.'
  },
  'tiger runtz': {
    type: 'hybrid',
    effects: ['Energetic', 'Focused', 'Uplifted'],
    flavors: ['Sweet', 'Citrus', 'Spicy'],
    description: 'A fierce Runtz phenotype with spicy citrus notes and energizing effects.'
  },
  'blue nerds': {
    type: 'hybrid',
    effects: ['Happy', 'Relaxed', 'Euphoric'],
    flavors: ['Berry', 'Sweet', 'Grape'],
    description: 'Candy-like strain with sweet berry flavors inspired by the popular candy.'
  },
  'london jelly': {
    name: 'London Jelly',
    type: 'hybrid',
    effects: ['Relaxed', 'Happy', 'Sleepy'],
    flavors: ['Sweet', 'Berry', 'Floral'],
    description: 'A UK-inspired strain with sweet jelly-like flavors and relaxing effects.'
  },
  'girl scout': {
    name: 'Girl Scout Cookies',
    type: 'hybrid',
    effects: ['Euphoric', 'Relaxed', 'Happy'],
    flavors: ['Sweet', 'Earthy', 'Mint'],
    description: 'Classic GSC with sweet and earthy notes, delivering euphoric relaxation.'
  },
  'gogurt': {
    type: 'hybrid',
    effects: ['Uplifted', 'Happy', 'Relaxed'],
    flavors: ['Fruity', 'Creamy', 'Sweet'],
    description: 'A creamy, fruity strain with yogurt-like smoothness and balanced effects.'
  },
  'cheese puff': {
    name: 'Cheese Puff',
    type: 'hybrid',
    effects: ['Relaxed', 'Happy', 'Giggly'],
    flavors: ['Cheese', 'Earthy', 'Pungent'],
    description: 'Unique cheese strain with savory notes and relaxing, giggly effects.'
  },
  'faygo cream': {
    name: 'Faygo Cream',
    type: 'hybrid',
    effects: ['Relaxed', 'Happy', 'Euphoric'],
    flavors: ['Creamy', 'Sweet', 'Vanilla'],
    description: 'Cream soda inspired strain with smooth vanilla notes and mellow effects.'
  },
  'candy gruntz': {
    name: 'Candy Gruntz',
    type: 'hybrid',
    effects: ['Happy', 'Uplifted', 'Relaxed'],
    flavors: ['Candy', 'Sweet', 'Fruity'],
    description: 'Super sweet candy strain with mixed fruit flavors and uplifting buzz.'
  },
  'blue ritz': {
    type: 'hybrid',
    effects: ['Relaxed', 'Sleepy', 'Happy'],
    flavors: ['Berry', 'Sweet', 'Earthy'],
    description: 'Blue-hued strain with berry sweetness and relaxing effects.'
  },
  'bolo candy': {
    name: 'Bolo Candy',
    type: 'hybrid',
    effects: ['Euphoric', 'Happy', 'Uplifted'],
    flavors: ['Candy', 'Sweet', 'Fruity'],
    description: 'Candy-coated strain with intense sweet flavors and euphoric lift.'
  },
  'purple runtz': {
    type: 'hybrid',
    effects: ['Relaxed', 'Happy', 'Sleepy'],
    flavors: ['Grape', 'Sweet', 'Candy'],
    description: 'Purple phenotype of the famous Runtz with grape candy flavors.'
  },
  'glitter bomb': {
    name: 'Glitter Bomb',
    type: 'hybrid',
    effects: ['Euphoric', 'Creative', 'Uplifted'],
    flavors: ['Sweet', 'Fruity', 'Tropical'],
    description: 'Sparkly trichome-covered strain with tropical fruit flavors and creative buzz.'
  },
  'banana': {
    name: 'Banana',
    type: 'hybrid',
    effects: ['Happy', 'Relaxed', 'Uplifted'],
    flavors: ['Banana', 'Tropical', 'Sweet'],
    description: 'Tropical strain with distinct banana aroma and balanced hybrid effects.'
  },
  'ghost rider': {
    name: 'Ghost Rider',
    type: 'indica',
    effects: ['Relaxed', 'Sleepy', 'Euphoric'],
    flavors: ['Earthy', 'Pine', 'Spicy'],
    description: 'Potent indica with earthy pine flavors and heavy sedative effects.'
  },
  'golden gush': {
    name: 'Golden Gush',
    type: 'hybrid',
    effects: ['Euphoric', 'Happy', 'Relaxed'],
    flavors: ['Tropical', 'Sweet', 'Citrus'],
    description: 'Golden-hued strain with tropical fruit flavors and euphoric effects.'
  },
  'japanese peaches': {
    name: 'Japanese Peaches',
    type: 'hybrid',
    effects: ['Uplifted', 'Creative', 'Happy'],
    flavors: ['Peach', 'Sweet', 'Fruity'],
    description: 'Exotic peach-flavored strain with sweet fruit notes and uplifting effects.'
  },
  'pop candy': {
    name: 'Pop Candy',
    type: 'hybrid',
    effects: ['Happy', 'Energetic', 'Uplifted'],
    flavors: ['Candy', 'Sweet', 'Fruity'],
    description: 'Bursting with candy sweetness and energetic, happy vibes.'
  },
  'matcha latto': {
    name: 'Matcha Latto',
    type: 'hybrid',
    effects: ['Focused', 'Uplifted', 'Energetic'],
    flavors: ['Earthy', 'Sweet', 'Herbal'],
    description: 'Unique strain with tea-like earthy flavors and focusing effects.'
  },
  'pink pink runtz': {
    name: 'Pink Pink Runtz',
    type: 'hybrid',
    effects: ['Relaxed', 'Happy', 'Euphoric'],
    flavors: ['Berry', 'Sweet', 'Candy'],
    description: 'Double pink Runtz selection with intensified berry candy flavors.'
  },
  'blow pop': {
    name: 'Blow Pop',
    type: 'hybrid',
    effects: ['Happy', 'Uplifted', 'Relaxed'],
    flavors: ['Candy', 'Sweet', 'Fruity'],
    description: 'Candy strain with bubblegum and fruit flavors like the classic lollipop.'
  },
  'blue zushi runtz': {
    name: 'Blue Zushi Runtz',
    type: 'indica',
    effects: ['Relaxed', 'Sleepy', 'Happy'],
    flavors: ['Berry', 'Sweet', 'Grape'],
    description: 'Blue-hued Zushi cross with Runtz bringing grape berry sweetness.'
  },
  'glue latto': {
    name: 'Glue Latto',
    type: 'hybrid',
    effects: ['Relaxed', 'Euphoric', 'Sleepy'],
    flavors: ['Earthy', 'Sweet', 'Diesel'],
    description: 'Gorilla Glue and Gelato cross delivering sticky sweet relaxation.'
  },
  'atm': {
    name: 'ATM',
    type: 'hybrid',
    effects: ['Energetic', 'Focused', 'Creative'],
    flavors: ['Citrus', 'Diesel', 'Earthy'],
    description: 'High-value strain with potent effects and complex citrus diesel profile.'
  },
  'blue a': {
    name: 'Blue Apples',
    type: 'indica',
    effects: ['Relaxed', 'Sleepy', 'Happy'],
    flavors: ['Berry', 'Apple', 'Sweet'],
    description: 'Blue-tinged strain with apple and berry notes and relaxing effects.'
  },
  'lcg': {
    name: 'Lemon Cherry Gelato',
    type: 'hybrid',
    effects: ['Balanced', 'Uplifted', 'Relaxed'],
    flavors: ['Lemon', 'Cherry', 'Creamy'],
    description: 'Popular Backpackboyz strain combining lemon, cherry, and gelato genetics.'
  },
  'lol runtz': {
    name: 'LOL Runtz',
    type: 'hybrid',
    effects: ['Giggly', 'Happy', 'Euphoric'],
    flavors: ['Sweet', 'Fruity', 'Candy'],
    description: 'A giggly, fun Runtz variety with intense sweet candy flavors.'
  },
  'bomb popz': {
    name: 'Bomb Popz',
    type: 'hybrid',
    effects: ['Energetic', 'Uplifted', 'Happy'],
    flavors: ['Fruity', 'Sweet', 'Tropical'],
    description: 'Explosive fruity flavors with energetic uplifting effects.'
  },
  'pure sherb': {
    name: 'Pure Sherb',
    type: 'hybrid',
    effects: ['Relaxed', 'Happy', 'Euphoric'],
    flavors: ['Sweet', 'Creamy', 'Fruity'],
    description: 'Pure Sherbet genetics delivering creamy sweet flavors and mellow vibes.'
  },
  'gary runtz': {
    name: 'Gary Runtz',
    type: 'hybrid',
    effects: ['Uplifted', 'Creative', 'Energetic'],
    flavors: ['Sweet', 'Fruity', 'Diesel'],
    description: 'Gary Payton and Runtz cross bringing together sweet and diesel notes.'
  }
};

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    console.log('🚀 Creating products for unmatched strains...\n');
    
    // Get Flora Distro vendor
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, store_name')
      .or('slug.eq.flora-distro,store_name.ilike.%Flora Distro%')
      .single();
    
    if (!vendor) {
      return NextResponse.json({ error: 'Flora Distro not found' }, { status: 404 });
    }
    
    // Get flower category
    const { data: flowerCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', 'flower')
      .single();
    
    if (!flowerCategory) {
      return NextResponse.json({ error: 'Flower category not found' }, { status: 404 });
    }
    
    // Get unmatched images from request
    const body = await request.json();
    const { unmatchedImages } = body;
    
    const created: any[] = [];
    const failed: any[] = [];
    
    for (const item of unmatchedImages) {
      try {
        const imageName = item.image.replace(/\.[^/.]+$/, '');
        const nameClean = imageName.replace(/[_-]/g, ' ').toLowerCase().trim();
        
        // Find strain data
        const strainKey = Object.keys(STRAIN_DATA).find(key => 
          nameClean.includes(key) || key.includes(nameClean)
        );
        
        const strainInfo = strainKey ? STRAIN_DATA[strainKey] : {
          type: 'hybrid',
          effects: ['Relaxed', 'Happy', 'Uplifted'],
          flavors: ['Sweet', 'Earthy', 'Fruity'],
          description: `Premium ${imageName} flower with balanced hybrid effects.`
        };
        
        const productName = strainInfo.name || imageName.replace(/_/g, ' ');
        const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        // Get image public URL
        const { data: { publicUrl } } = supabase.storage
          .from('vendor-product-images')
          .getPublicUrl(`${vendor.id}/${item.image}`);
        
        // Create product
        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert({
            name: productName,
            slug: slug,
            vendor_id: vendor.id,
            primary_category_id: flowerCategory.id,
            type: 'simple',
            status: 'published', // Auto-approved
            featured_image_storage: publicUrl,
            description: strainInfo.description,
            short_description: `${strainInfo.type.charAt(0).toUpperCase() + strainInfo.type.slice(1)} strain with ${strainInfo.flavors.slice(0, 2).join(' and ')} flavors.`,
            regular_price: 35.00, // Default pricing
            manage_stock: true,
            stock_status: 'instock',
            blueprint_fields: {
              strain_type: strainInfo.type,
              effects: strainInfo.effects,
              flavors: strainInfo.flavors,
              thc_percentage: '20-25%',
              cbd_percentage: '<1%',
              terpenes: ['Caryophyllene', 'Limonene', 'Myrcene']
            },
            attributes: {
              strain_type: [strainInfo.type],
              effects: strainInfo.effects,
              flavors: strainInfo.flavors
            }
          })
          .select()
          .single();
        
        if (createError) {
          console.error(`❌ Failed to create ${productName}:`, createError.message);
          failed.push({
            image: item.image,
            productName,
            error: createError.message
          });
        } else {
          console.log(`✅ CREATED & ATTACHED: ${productName} with ${item.image}`);
          created.push({
            image: item.image,
            product: newProduct.name,
            productId: newProduct.id,
            imageUrl: publicUrl
          });
        }
        
      } catch (error: any) {
        console.error(`❌ Error processing ${item.image}:`, error.message);
        failed.push({
          image: item.image,
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        totalProcessed: unmatchedImages.length,
        created: created.length,
        failed: failed.length
      },
      created,
      failed
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

