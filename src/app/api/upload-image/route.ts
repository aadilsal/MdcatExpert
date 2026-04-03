import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const questionId = formData.get("questionId") as string;

    if (!file || !questionId) {
      return NextResponse.json(
        { error: "Missing file or questionId" },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if Images bucket exists, create if not
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    const imagesBucket = buckets?.find(b => b.name === 'Images');

    if (!imagesBucket) {
      console.log("Images bucket doesn't exist, creating...");
      const { error: createError } = await supabase.storage.createBucket('Images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error("Failed to create Images bucket:", createError);
        return NextResponse.json(
          { error: `Failed to create bucket: ${createError.message}` },
          { status: 500 }
        );
      }
      console.log("Images bucket created successfully");
    } else {
      console.log("Images bucket exists, checking if it's public...");
      // If bucket exists but might not be public, try to update it
      const { data: bucketDetails, error: bucketError } = await supabase.storage.getBucket('Images');
      console.log("Bucket details:", bucketDetails);

      if (bucketError) {
        console.error("Error getting bucket details:", bucketError);
      } else if (!bucketDetails?.public) {
        console.log("Bucket exists but is not public, attempting to make it public...");
        // Try to update bucket to be public
        const { error: updateError } = await supabase.storage.updateBucket('Images', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880
        });

        if (updateError) {
          console.error("Failed to update bucket to public:", updateError);
          return NextResponse.json(
            { error: `Failed to make bucket public: ${updateError.message}` },
            { status: 500 }
          );
        }
        console.log("Images bucket updated to public successfully");
      } else {
        console.log("Images bucket is already public");
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `question-${questionId}-${Date.now()}.${fileExt}`;

    console.log("Uploading file:", fileName, "Size:", file.size, "Type:", file.type);

    // Upload to Images bucket
    const { error: uploadError } = await supabase.storage
      .from("Images")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log("File uploaded successfully");

    const { data: { publicUrl } } = supabase.storage
      .from("Images")
      .getPublicUrl(fileName);

    console.log("Generated public URL:", publicUrl);

    return NextResponse.json({ publicUrl });

  } catch (error) {
    console.error("Image upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}