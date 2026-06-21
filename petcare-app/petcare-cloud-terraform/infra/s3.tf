resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "pet_images" {
  bucket = "${local.name_prefix}-pet-images-${random_id.bucket_suffix.hex}"

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-pet-images"
  })
}

resource "aws_s3_bucket_public_access_block" "pet_images" {
  bucket = aws_s3_bucket.pet_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
