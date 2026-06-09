import createError from 'http-errors';
import prisma from '../../configs/prismaConfig';
import { HostelApplicationStatus, HostelType } from '../../../generated/prisma';

export const createHostel = async (data: any, tenantId: string) => {
  return prisma.hostel.create({
    data: {
      ...data,
      tenantId,
    },
  });
};

export const updateHostel = async (id: string, tenantId: string, data: any) => {
  const hostel = await prisma.hostel.findFirst({
    where: { id, tenantId },
  });

  if (!hostel) {
    throw createError(404, 'Hostel not found');
  }

  // Edge Case: If updating capacity, ensure it doesn't fall below currently approved spaces
  if (data.capacity !== undefined) {
    const approvedCount = await prisma.hostelApplication.count({
      where: {
        hostelId: id,
        status: 'APPROVED',
      },
    });

    if (data.capacity < approvedCount) {
      throw createError(
        400,
        `Cannot reduce capacity to ${data.capacity}. There are currently ${approvedCount} approved applications.`,
      );
    }
  }

  return prisma.hostel.update({
    where: { id },
    data,
  });
};

export const deleteHostel = async (id: string, tenantId: string) => {
  const hostel = await prisma.hostel.findFirst({
    where: { id, tenantId },
  });

  if (!hostel) {
    throw createError(404, 'Hostel not found');
  }

  return prisma.hostel.delete({
    where: { id },
  });
};

export const getHostels = async (tenantId: string) => {
  const hostels = await prisma.hostel.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: {
          applications: {
            where: { status: 'APPROVED' },
          },
        },
      },
    },
  });

  return hostels.map((hostel) => ({
    ...hostel,
    availableSpaces: hostel.capacity - hostel._count.applications,
    _count: undefined,
  }));
};

export const applyForHostel = async (
  hostelId: string,
  studentId: string,
  tenantId: string,
) => {
  // Check if hostel exists and belongs to same tenant
  const hostel = await prisma.hostel.findFirst({
    where: { id: hostelId, tenantId },
    include: {
      _count: {
        select: {
          applications: {
            where: { status: 'APPROVED' },
          },
        },
      },
    },
  });

  if (!hostel) {
    throw createError(404, 'Hostel not found');
  }

  // Check capacity
  if (hostel._count.applications >= hostel.capacity) {
    throw createError(400, 'Hostel is at full capacity');
  }

  // Check if student already has a pending or approved application across all hostels
  const existingApplication = await prisma.hostelApplication.findFirst({
    where: {
      studentId,
      status: {
        in: ['PENDING', 'APPROVED'],
      },
    },
  });

  if (existingApplication) {
    throw createError(400, 'You already have an active hostel application');
  }

  // Find student's admission application to verify gender
  const admissionApp = await prisma.application.findFirst({
    where: {
      applicantId: studentId,
      schoolId: tenantId,
      status: 'APPROVED',
    },
  });

  if (!admissionApp || !admissionApp.personalDetails) {
    throw createError(
      400,
      'Could not determine student gender from admission records',
    );
  }

  const { gender } = admissionApp.personalDetails;

  if (hostel.type === 'MALE' && gender !== 'MALE') {
    throw createError(400, 'This hostel is strictly for male students');
  }

  if (hostel.type === 'FEMALE' && gender !== 'FEMALE') {
    throw createError(400, 'This hostel is strictly for female students');
  }

  return prisma.hostelApplication.create({
    data: {
      hostelId,
      studentId,
      tenantId,
    },
  });
};

export const getHostelApplications = async (
  hostelId: string,
  tenantId: string,
) => {
  const hostel = await prisma.hostel.findFirst({
    where: { id: hostelId, tenantId },
  });

  if (!hostel) {
    throw createError(404, 'Hostel not found');
  }

  return prisma.hostelApplication.findMany({
    where: { hostelId, tenantId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const reviewHostelApplication = async (
  applicationId: string,
  tenantId: string,
  status: HostelApplicationStatus,
  rejectionReason?: string,
) => {
  return prisma.$transaction(async (tx) => {
    const application = await tx.hostelApplication.findFirst({
      where: { id: applicationId, tenantId },
      include: { hostel: true },
    });

    if (!application) {
      throw createError(404, 'Application not found');
    }

    if (application.status !== 'PENDING') {
      throw createError(400, `Application is already ${application.status}`);
    }

    if (status === 'APPROVED') {
      // Re-check capacity securely inside transaction
      const approvedCount = await tx.hostelApplication.count({
        where: {
          hostelId: application.hostelId,
          status: 'APPROVED',
        },
      });

      if (approvedCount >= application.hostel.capacity) {
        throw createError(400, 'Hostel is now at full capacity');
      }
    }

    return tx.hostelApplication.update({
      where: { id: applicationId },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
    });
  });
};
