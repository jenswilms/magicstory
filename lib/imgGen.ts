export async function generateImage(keywords: string) {
  const Replicate = require("replicate");

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_KEY,
  });

  const prompt = `Cute ${keywords},unreal engine, artstation, detailed, 
  digital painting,cinematic,character design by mark ryden and pixar and hayao miyazaki, 
  unreal 5, daz, hyperrealistic, octane render`;

  const response = await replicate.run(
    "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
    {
      input: {
        prompt: prompt,
        image_dimensions: "128x128",
        num_inference_steps: 25,
        num_outputs: 1,
        guideance_scale: 8,
        refine: "expert_ensemble_refiner",
        scheduler: "K_EULER",
      },
    }
  );

  return response;
}
