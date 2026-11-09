import Category from "../models/category.model";

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const existing = await Category.findOne({
    slug: data.slug,
  });

  if (existing) {
    throw new Error("CATEGORY_SLUG_EXISTS");
  }

  return Category.create(data);
}

export async function getCategories(includeInactive = false) {
  const filter = includeInactive
    ? {}
    : { isActive: true };

  return Category.find(filter).sort({
    sortOrder: 1,
    createdAt: -1,
  });
}

export async function getCategoryById(id: string) {
  return Category.findById(id);
}

export async function updateCategory(
  id: string,
  data: Record<string, unknown>
) {
  if (data.slug) {
    const existing = await Category.findOne({
      slug: data.slug,
      _id: { $ne: id },
    });

    if (existing) {
      throw new Error("CATEGORY_SLUG_EXISTS");
    }
  }

  return Category.findByIdAndUpdate(
    id,
    data,
    {
      new: true,
      runValidators: true,
    }
  );
}

export async function deleteCategory(id: string) {
  return Category.findByIdAndUpdate(
    id,
    {
      isActive: false,
    },
    {
      new: true,
    }
  );
}