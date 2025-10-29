/**
 * Workflow Routes
 * CRUD operations for ML workflows
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../../database/client.js';
import { WorkflowStatus } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/workflows
 * @desc    List all workflows
 * @access  Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = status ? { status: status as WorkflowStatus } : {};

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              datasets: true,
              models: true,
              experiments: true,
            },
          },
        },
      }),
      prisma.workflow.count({ where }),
    ]);

    res.json({
      workflows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

/**
 * @route   GET /api/workflows/:id
 * @desc    Get workflow by ID
 * @access  Private
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        datasets: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        models: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        experiments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

/**
 * @route   POST /api/workflows
 * @desc    Create new workflow
 * @access  Private
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, status, config } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description,
        status: status || WorkflowStatus.DRAFT,
        config: config || {},
        createdBy: req.user?.userId || 'system',
      },
    });

    res.status(201).json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

/**
 * @route   PUT /api/workflows/:id
 * @desc    Update workflow
 * @access  Private
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, config } = req.body;

    const workflow = await prisma.workflow.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(config && { config }),
      },
    });

    res.json(workflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

/**
 * @route   DELETE /api/workflows/:id
 * @desc    Delete workflow
 * @access  Private
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.workflow.delete({
      where: { id },
    });

    res.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

/**
 * @route   POST /api/workflows/:id/execute
 * @desc    Execute workflow (trigger n8n)
 * @access  Private
 */
router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // TODO: Trigger n8n workflow execution
    // For now, just update status
    await prisma.workflow.update({
      where: { id },
      data: { status: WorkflowStatus.ACTIVE },
    });

    res.json({
      message: 'Workflow execution started',
      workflowId: id,
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
});

export default router;
