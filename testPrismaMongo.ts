import prisma from './src/configs/prismaConfig';
async function test() {
  try {
    const data = await prisma.application.findMany({
      where: {
        applicant: {
          is: {
            firstName: { contains: "Johnyyy", mode: "insensitive" }
          }
        }
      }
    });
    console.log("SUCCESS WITH IS!");
    
    // Now without 'is'
    const data2 = await prisma.application.findMany({
      where: {
        applicant: {
          firstName: { contains: "Johnyyy", mode: "insensitive" }
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    });
    console.log("SUCCESS WITHOUT IS!");
  } catch (e) {
    console.error("FAILED:", e);
  }
}
test();
