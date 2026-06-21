jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("../src/utils/notifications", () => ({
  LOCK_SCREEN_VOCABULARY_NOTIFICATION_TYPE: "lock_screen_vocabulary",
}));

import { getLockScreenVocabularyRouteFromNotificationResponse } from "../src/hooks/useLockScreenVocabularyNotificationRouting";
import { LOCK_SCREEN_VOCABULARY_NOTIFICATION_TYPE } from "../src/utils/notifications";

describe("lock screen vocabulary notification routing", () => {
  it("routes lock screen vocabulary notification taps to the vocabulary day", () => {
    expect(
      getLockScreenVocabularyRouteFromNotificationResponse({
        notification: {
          request: {
            identifier: "notification-1",
            content: {
              data: {
                type: LOCK_SCREEN_VOCABULARY_NOTIFICATION_TYPE,
                courseId: "TOEIC",
                dayNumber: 3,
                deepLink: "imagevocaapp://course/TOEIC/vocabulary?day=3",
              },
            },
          },
        },
      }),
    ).toEqual({
      pathname: "/course/[courseId]/vocabulary",
      params: {
        courseId: "TOEIC",
        day: "3",
      },
    });
  });

  it("ignores unrelated notification types", () => {
    expect(
      getLockScreenVocabularyRouteFromNotificationResponse({
        notification: {
          request: {
            content: {
              data: {
                type: "study_reminder",
              },
            },
          },
        },
      }),
    ).toBeNull();
  });
});
