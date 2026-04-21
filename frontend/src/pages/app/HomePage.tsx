import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Card, Badge, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { List, Car, PieChart, Zap } from 'lucide-react';

interface Exercise {
  number: number;
  title: string;
  description: string;
  learning: string;
  href: string;
  icon: React.ReactNode;
  difficulty: string;
  difficultyVariant: string;
}

const exercises: Exercise[] = [
  {
    number: 1,
    title: 'Task List',
    description:
      'A task management UI is already connected to a backend API with read functionality working. Your job is to add the missing features.',
    learning:
      'You can extend and modify an application you\'ve never seen before, without reading the code. Describe the change you want and the AI figures out where and how to make it happen.',
    href: '/exercises/tasks/list',
    icon: <List size={24} />,
    difficulty: 'Beginner',
    difficultyVariant: 'success',
  },
  {
    number: 2,
    title: 'Car Park Availability',
    description:
      'Build a complete car park availability system from scratch — database, API, and user interface. There is nothing set up yet.',
    learning:
      'You can build an entire feature from nothing by describing what you want the system to do. The AI designs the data model, follows the project\'s conventions, and creates the UI from your description.',
    href: '/exercises/parking',
    icon: <Car size={24} />,
    difficulty: 'Intermediate',
    difficultyVariant: 'warning',
  },
  {
    number: 3,
    title: 'Analytics Chart',
    description:
      'There is analytics data hidden somewhere in the backend. Find it using AI, then visualise it with a chart.',
    learning:
      'AI isn\'t just a code generator — it\'s an explorer. You can point it at an unfamiliar codebase and ask "what\'s here?" It can also choose and integrate tools on your behalf.',
    href: '/exercises/analytics-chart',
    icon: <PieChart size={24} />,
    difficulty: 'Intermediate',
    difficultyVariant: 'warning',
  },
  {
    number: 4,
    title: 'Stretch',
    description:
      'Go back to the exercises you\'ve completed and make them better. Clean up, add new features, and build a Command Centre that brings everything together.',
    learning:
      'AI can refactor and improve code it wrote earlier just as easily as writing it the first time. You\'ll also see how it handles cross-cutting changes that touch multiple parts of the application.',
    href: '/exercises/stretch',
    icon: <Zap size={24} />,
    difficulty: 'Advanced',
    difficultyVariant: 'danger',
  },
];

const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  return (
    <Card className="mb-3">
      <Card.Body>
        <Row className="align-items-start">
          <Col xs="auto" className="pe-0">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
              style={{ width: 56, height: 56 }}
            >
              {exercise.icon}
            </div>
          </Col>
          <Col>
            <div className="d-flex align-items-center mb-1">
              <Card.Title as="h5" className="mb-0 me-2">
                Exercise {exercise.number}: {exercise.title}
              </Card.Title>
              <Badge bg="" className={`badge-subtle-${exercise.difficultyVariant}`}>
                {exercise.difficulty}
              </Badge>
            </div>
            <p className="text-muted mb-2">{exercise.description}</p>
            <p className="mb-2" style={{ fontSize: '0.9rem' }}>
              <strong>What you'll learn:</strong> {exercise.learning}
            </p>
            <Link to={exercise.href} className="btn btn-primary btn-sm">
              Go to Exercise
            </Link>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

const HomePage = () => {
  return (
    <React.Fragment>
      <Helmet title="Home" />
      <Container fluid className="p-0">
        <h1 className="h3 mb-3">AI-Assisted Development Bootcamp</h1>

        <Card className="mb-4 border-primary">
          <Card.Body>
            <h5 className="mb-2">Welcome to the AI-Assisted Development Bootcamp</h5>
            <p className="mb-3">
              In this session you will use an AI coding assistant to build real features in a
              real application. <strong>You do not need to understand the code or the
              technology</strong> — you'll describe what you want in plain English and the AI
              will do the implementation for you.
            </p>

            <div className="rounded p-3 mb-3" style={{ background: '#f5e8f7' }}>
              <strong>How it works:</strong>
              <ol className="mb-0 mt-1">
                <li>Click on an exercise below to see its tasks.</li>
                <li>Read the task description, then tell Claude what you want in your own words.</li>
                <li>Let Claude make the changes. Review what it did, then move to the next task.</li>
                <li>If you get stuck, each task has an example prompt you can reveal and copy.</li>
                <li>If something goes wrong, just tell Claude what happened and it will fix it.</li>
              </ol>
            </div>

            <div className="rounded p-3 mb-0" style={{ background: '#ede0f0' }}>
              <strong>What you'll learn:</strong> You can build, extend, and explore software
              without understanding the codebase or the technology that powers it. Across the
              exercises you'll see that AI can modify existing code, build entire features from
              scratch, explore an unfamiliar codebase, choose and integrate tools, and combine
              systems together — all from plain English descriptions of what you want.
            </div>
          </Card.Body>
        </Card>

        <h2 className="h4 mb-3">Exercises</h2>

        {exercises.map((exercise) => (
          <ExerciseCard key={exercise.number} exercise={exercise} />
        ))}
      </Container>
    </React.Fragment>
  );
};

export default HomePage;
