import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../shared/errors.js';

interface CreateLegalDocumentInput {
  type: string;
  locale: string;
  title: string;
  content: string;
  version: string;
  active?: boolean;
}

interface UpdateLegalDocumentInput {
  type?: string;
  locale?: string;
  title?: string;
  content?: string;
  version?: string;
  active?: boolean;
}

export async function getActiveByType(type: string, locale = 'pt-BR') {
  const document = await prisma.legalDocument.findFirst({
    where: {
      type,
      locale,
      active: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!document) {
    throw new NotFoundError('LegalDocument');
  }

  return document;
}

export async function listActive() {
  const documents = await prisma.legalDocument.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  });

  return documents;
}

export async function listAll(page = 1, perPage = 20) {
  const [documents, total] = await Promise.all([
    prisma.legalDocument.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.legalDocument.count(),
  ]);

  return {
    documents,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}

export async function create(data: CreateLegalDocumentInput) {
  const document = await prisma.legalDocument.create({
    data: {
      type: data.type,
      locale: data.locale,
      title: data.title,
      content: data.content,
      version: data.version,
      active: data.active ?? true,
    },
  });

  return document;
}

export async function update(id: string, data: UpdateLegalDocumentInput) {
  const existing = await prisma.legalDocument.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('LegalDocument');
  }

  const updateData: Record<string, unknown> = {};

  if (data.type !== undefined) updateData.type = data.type;
  if (data.locale !== undefined) updateData.locale = data.locale;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.version !== undefined) updateData.version = data.version;
  if (data.active !== undefined) updateData.active = data.active;

  const document = await prisma.legalDocument.update({
    where: { id },
    data: updateData,
  });

  return document;
}

export async function deleteDocument(id: string) {
  const existing = await prisma.legalDocument.findUnique({ where: { id } });

  if (!existing) {
    throw new NotFoundError('LegalDocument');
  }

  await prisma.legalDocument.delete({ where: { id } });
}
