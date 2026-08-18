import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workshopSession: {
      findUnique: vi.fn(),
    },
    workshopLead: {
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { captureWorkshopLeadAction } from "@/lib/workshop/lead-actions";

const mockedFind = vi.mocked(prisma.workshopSession.findUnique);
const mockedUpsert = vi.mocked(prisma.workshopLead.upsert);

function mockSession() {
  mockedFind.mockResolvedValue({
    id: "sess-1",
    goalsJson: null,
    riskQuizJson: null,
    goalJourneyJson: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSession();
  mockedUpsert.mockResolvedValue({ id: "lead-1" });
});

describe("captureWorkshopLeadAction — WhatsApp PDF queue flag", () => {
  it("queues WhatsApp delivery (requestedAt set) when a phone is provided", async () => {
    const result = await captureWorkshopLeadAction({
      sessionId: "sess-1",
      name: "Ada",
      email: "ada@example.com",
      phone: "+85291234567",
      selectedGoal: "Retirement",
    });

    expect(result).toEqual({ ok: true, leadId: "lead-1" });
    const create = mockedUpsert.mock.calls[0][0].create as Record<
      string,
      unknown
    >;
    expect(create.whatsappPdfRequestedAt).toBeInstanceOf(Date);
    expect(create.phone).toBe("+85291234567");
  });

  it("does not queue WhatsApp delivery when phone is empty", async () => {
    const result = await captureWorkshopLeadAction({
      sessionId: "sess-1",
      name: "Ada",
      email: "ada@example.com",
      phone: "",
      selectedGoal: "Retirement",
    });

    expect(result.ok).toBe(true);
    const create = mockedUpsert.mock.calls[0][0].create as Record<
      string,
      unknown
    >;
    expect(create.whatsappPdfRequestedAt).toBeNull();
    expect(create.phone).toBe("");
  });

  it("re-queues on re-capture with a phone, leaves fields untouched without one", async () => {
    await captureWorkshopLeadAction({
      sessionId: "sess-1",
      name: "Ada",
      email: "",
      phone: "+85261234567",
      selectedGoal: "Retirement",
    });

    const update = mockedUpsert.mock.calls[0][0].update as Record<
      string,
      unknown
    >;
    expect(update.whatsappPdfRequestedAt).toBeInstanceOf(Date);

    await captureWorkshopLeadAction({
      sessionId: "sess-1",
      name: "Ada",
      email: "",
      phone: "",
      selectedGoal: "Retirement",
    });
    const updateNoPhone = mockedUpsert.mock.calls[1][0].update as Record<
      string,
      unknown
    >;
    expect(updateNoPhone.whatsappPdfRequestedAt).toBeUndefined();
  });
});
