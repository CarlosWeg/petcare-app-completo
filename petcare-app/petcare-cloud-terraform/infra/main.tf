locals {
  name_prefix = var.project_name

  tags = merge(
    var.common_tags,
    {
      ManagedBy = "Terraform"
    }
  )
}
