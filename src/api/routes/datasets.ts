/**
 * Dataset Routes
 * CRUD operations for ML datasets
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../../database/client.js';
import { DatasetType } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/datasets
 * @desc    List all datasets
 * @access  Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, workflowId, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (type) where.type = type as DatasetType;
    if (workflowId) where.workflowId = workflowId as string;

    const [datasets, total] = await Promise.all([
      prisma.dataset.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          workflow: {
            select: { id: true, name: true },
          },
          _count: {
            select: { versions: true, trainingJobs: true },
          },
        },
      }),
      prisma.dataset.count({ where }),
    ]);

    res.json({
      datasets,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

/**
 * @route   GET /api/datasets/:id
 * @desc    Get dataset by ID
 * @access  Private
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: {
        workflow: true,
        versions: {
          orderBy: { version: 'desc' },
        },
        trainingJobs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            displayName: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json(dataset);
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
});

/**
 * @route   POST /api/datasets
 * @desc    Create new dataset
 * @access  Private
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      type,
      size,
      rowCount,
      storagePath,
      format,
      schema,
      stats,
      tags,
      workflowId,
    } = req.body;

    // Validation
    if (!name || !type || !storagePath || !format) {
      return res.status(400).json({
        error: 'Name, type, storagePath, and format are required',
      });
    }

    const dataset = await prisma.dataset.create({
      data: {
        name,
        description,
        type,
        size: size ? BigInt(size) : BigInt(0),
        rowCount,
        storagePath,
        format,
        schema,
        stats,
        tags: tags || [],
        workflowId,
      },
    });

    res.status(201).json(dataset);
  } catch (error) {
    console.error('Error creating dataset:', error);
    res.status(500).json({ error: 'Failed to create dataset' });
  }
});

/**
 * @route   PUT /api/datasets/:id
 * @desc    Update dataset
 * @access  Private
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      type,
      size,
      rowCount,
      storagePath,
      format,
      schema,
      stats,
      tags,
      workflowId,
    } = req.body;

    const dataset = await prisma.dataset.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(size !== undefined && { size: BigInt(size) }),
        ...(rowCount !== undefined && { rowCount }),
        ...(storagePath && { storagePath }),
        ...(format && { format }),
        ...(schema && { schema }),
        ...(stats && { stats }),
        ...(tags && { tags }),
        ...(workflowId !== undefined && { workflowId }),
      },
    });

    res.json(dataset);
  } catch (error) {
    console.error('Error updating dataset:', error);
    res.status(500).json({ error: 'Failed to update dataset' });
  }
});

/**
 * @route   DELETE /api/datasets/:id
 * @desc    Delete dataset
 * @access  Private
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.dataset.delete({
      where: { id },
    });

    res.json({ message: 'Dataset deleted successfully' });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    res.status(500).json({ error: 'Failed to delete dataset' });
  }
});

/**
 * @route   POST /api/datasets/:id/versions
 * @desc    Create new dataset version
 * @access  Private
 */
router.post('/:id/versions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, storagePath, size, checksum, changes } = req.body;

    // Get latest version number
    const latestVersion = await prisma.datasetVersion.findFirst({
      where: { datasetId: id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    const version = await prisma.datasetVersion.create({
      data: {
        datasetId: id,
        version: nextVersion,
        description,
        storagePath,
        size: BigInt(size),
        checksum,
        changes,
      },
    });

    res.status(201).json(version);
  } catch (error) {
    console.error('Error creating dataset version:', error);
    res.status(500).json({ error: 'Failed to create dataset version' });
  }
});

/**
 * @route   GET /api/datasets/:id/stats
 * @desc    Get dataset statistics
 * @access  Private
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const dataset = await prisma.dataset.findUnique({
      where: { id },
      select: {
        stats: true,
        size: true,
        rowCount: true,
        type: true,
        _count: {
          select: { versions: true, trainingJobs: true },
        },
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json({
      type: dataset.type,
      size: dataset.size.toString(),
      rowCount: dataset.rowCount,
      versionCount: dataset._count.versions,
      trainingJobCount: dataset._count.trainingJobs,
      statistics: dataset.stats,
    });
  } catch (error) {
    console.error('Error fetching dataset stats:', error);
    res.status(500).json({ error: 'Failed to fetch dataset stats' });
  }
});

export default router;
