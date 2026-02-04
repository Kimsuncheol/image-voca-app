import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { MyClassCard } from '../components/student/classes/MyClassCard';
import { AssignmentDueCard } from '../components/student/classes/AssignmentDueCard';
import { JoinClassModal } from '../components/student/classes/JoinClassModal';
import type { ClassData } from '../src/types/teacher';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('Teacher/Student Components', () => {
  describe('MyClassCard', () => {
    const mockClassData: ClassData = {
      id: 'class123',
      name: 'English 101',
      teacherId: 'teacher123',
      teacherName: 'Mr. Smith',
      courseIds: ['TOEIC', 'TOEFL', 'IELTS'],
      studentIds: ['student1', 'student2', 'student3'],
      inviteCode: 'ABC123',
      description: 'Beginner English class',
      createdAt: new Date('2026-01-01').toISOString(),
      isArchived: false,
    };

    test('should render class name and teacher', () => {
      const onPress = jest.fn();

      const { getByText } = render(
        <MyClassCard classData={mockClassData} isDark={false} onPress={onPress} />
      );

      expect(getByText('English 101')).toBeTruthy();
      expect(getByText('Mr. Smith')).toBeTruthy();
    });

    test('should display course badges', () => {
      const onPress = jest.fn();

      const { getByText } = render(
        <MyClassCard classData={mockClassData} isDark={false} onPress={onPress} />
      );

      expect(getByText('TOEIC')).toBeTruthy();
      expect(getByText('TOEFL')).toBeTruthy();
      expect(getByText('IELTS')).toBeTruthy();
    });

    test('should display only first 3 courses when more than 3 exist', () => {
      const classWithManyCourses = {
        ...mockClassData,
        courseIds: ['TOEIC', 'TOEFL', 'IELTS', 'OPIC', 'CSAT'] as any,
      };
      const onPress = jest.fn();

      const { getByText, queryByText } = render(
        <MyClassCard classData={classWithManyCourses} isDark={false} onPress={onPress} />
      );

      expect(getByText('TOEIC')).toBeTruthy();
      expect(getByText('TOEFL')).toBeTruthy();
      expect(getByText('IELTS')).toBeTruthy();
      expect(queryByText('OPIC')).toBeNull();
      expect(queryByText('CSAT')).toBeNull();
    });

    test('should call onPress when card is pressed', () => {
      const onPress = jest.fn();

      const { getByText } = render(
        <MyClassCard classData={mockClassData} isDark={false} onPress={onPress} />
      );

      fireEvent.press(getByText('English 101'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    test('should display student count', () => {
      const onPress = jest.fn();

      const { getByText } = render(
        <MyClassCard classData={mockClassData} isDark={false} onPress={onPress} />
      );

      expect(getByText('3 students')).toBeTruthy();
    });
  });

  describe('AssignmentDueCard', () => {
    const mockAssignment = {
      id: 'assignment123',
      classId: 'class123',
      courseId: 'TOEIC' as any,
      dayNumber: 5,
      title: 'Day 5 Vocabulary',
      description: 'Complete vocabulary',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      requiredActions: {
        completeVocabulary: true,
        completeQuiz: true,
        minQuizScore: 80,
      },
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    };

    test('should render assignment title', () => {
      const onPress = jest.fn();

      const { getByText } = render(
        <AssignmentDueCard assignment={mockAssignment} isDark={false} onPress={onPress} />
      );

      expect(getByText('Day 5 Vocabulary')).toBeTruthy();
    });

    test('should display "Due in X days" for future due dates', () => {
      const onPress = jest.fn();

      const { getByText } = render(
        <AssignmentDueCard assignment={mockAssignment} isDark={false} onPress={onPress} />
      );

      expect(getByText(/Due in \d+ day/)).toBeTruthy();
    });

    test('should display "Due today" when due today', () => {
      const todayAssignment = {
        ...mockAssignment,
        dueDate: new Date().toISOString(),
      };
      const onPress = jest.fn();

      const { getByText } = render(
        <AssignmentDueCard assignment={todayAssignment} isDark={false} onPress={onPress} />
      );

      expect(getByText('Due today')).toBeTruthy();
    });

    test('should display "Overdue" for past due dates', () => {
      const overdueAssignment = {
        ...mockAssignment,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        isOverdue: true,
      };
      const onPress = jest.fn();

      const { getByText } = render(
        <AssignmentDueCard assignment={overdueAssignment} isDark={false} onPress={onPress} />
      );

      expect(getByText('Overdue')).toBeTruthy();
    });

    test('should display "Completed" status when submission is completed', () => {
      const completedAssignment = {
        ...mockAssignment,
        submission: {
          id: 'submission123',
          assignmentId: 'assignment123',
          studentId: 'student123',
          status: 'completed' as const,
          submittedAt: new Date().toISOString(),
        },
      };
      const onPress = jest.fn();

      const { getByText } = render(
        <AssignmentDueCard assignment={completedAssignment} isDark={false} onPress={onPress} />
      );

      expect(getByText('Completed')).toBeTruthy();
    });

    test('should display course and day information', () => {
      const onPress = jest.fn();

      const { getByText } = render(
        <AssignmentDueCard assignment={mockAssignment} isDark={false} onPress={onPress} />
      );

      expect(getByText('TOEIC - Day 5')).toBeTruthy();
    });

    test('should call onPress when card is pressed', () => {
      const onPress = jest.fn();

      const { getByText } = render(
        <AssignmentDueCard assignment={mockAssignment} isDark={false} onPress={onPress} />
      );

      fireEvent.press(getByText('Day 5 Vocabulary'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('JoinClassModal', () => {
    test('should render modal when visible', () => {
      const onClose = jest.fn();
      const onJoin = jest.fn();

      const { getByText, getByPlaceholderText } = render(
        <JoinClassModal
          visible={true}
          onClose={onClose}
          onJoin={onJoin}
          isDark={false}
        />
      );

      expect(getByText('Join Class')).toBeTruthy();
      expect(getByPlaceholderText('Enter 6-character code')).toBeTruthy();
    });

    test('should not render modal when not visible', () => {
      const onClose = jest.fn();
      const onJoin = jest.fn();

      const { queryByText } = render(
        <JoinClassModal
          visible={false}
          onClose={onClose}
          onJoin={onJoin}
          isDark={false}
        />
      );

      expect(queryByText('Join Class')).toBeNull();
    });

    test('should call onClose when cancel button is pressed', () => {
      const onClose = jest.fn();
      const onJoin = jest.fn();

      const { getByText } = render(
        <JoinClassModal
          visible={true}
          onClose={onClose}
          onJoin={onJoin}
          isDark={false}
        />
      );

      fireEvent.press(getByText('Cancel'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('should update invite code input', () => {
      const onClose = jest.fn();
      const onJoin = jest.fn();

      const { getByPlaceholderText } = render(
        <JoinClassModal
          visible={true}
          onClose={onClose}
          onJoin={onJoin}
          isDark={false}
        />
      );

      const input = getByPlaceholderText('Enter 6-character code');
      fireEvent.changeText(input, 'ABC123');

      expect(input.props.value).toBe('ABC123');
    });

    test('should call onJoin with invite code when join button is pressed', () => {
      const onClose = jest.fn();
      const onJoin = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <JoinClassModal
          visible={true}
          onClose={onClose}
          onJoin={onJoin}
          isDark={false}
        />
      );

      const input = getByPlaceholderText('Enter 6-character code');
      fireEvent.changeText(input, 'ABC123');

      const joinButton = getByText('Join Class');
      fireEvent.press(joinButton);

      expect(onJoin).toHaveBeenCalledWith('ABC123');
    });

    test('should convert invite code to uppercase', () => {
      const onClose = jest.fn();
      const onJoin = jest.fn();

      const { getByPlaceholderText } = render(
        <JoinClassModal
          visible={true}
          onClose={onClose}
          onJoin={onJoin}
          isDark={false}
        />
      );

      const input = getByPlaceholderText('Enter 6-character code');
      fireEvent.changeText(input, 'abc123');

      expect(input.props.value).toBe('ABC123');
    });

    test('should show loading state when joining', () => {
      const onClose = jest.fn();
      const onJoin = jest.fn();

      const { getByText } = render(
        <JoinClassModal
          visible={true}
          onClose={onClose}
          onJoin={onJoin}
          isDark={false}
          loading={true}
        />
      );

      expect(getByText('Joining...')).toBeTruthy();
    });

    test('should disable join button when loading', () => {
      const onClose = jest.fn();
      const onJoin = jest.fn();

      const { getByText } = render(
        <JoinClassModal
          visible={true}
          onClose={onClose}
          onJoin={onJoin}
          isDark={false}
          loading={true}
        />
      );

      const joinButton = getByText('Joining...');
      expect(joinButton.props.accessibilityState?.disabled).toBeTruthy();
    });
  });
});
