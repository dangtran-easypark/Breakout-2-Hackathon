import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Copy, Sparkles } from 'lucide-react';

const promptBlockStyle: React.CSSProperties = {
  background: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '6px',
  padding: '10px 14px',
  fontSize: '0.9rem',
  lineHeight: '1.5',
  cursor: 'pointer',
};

const RevealablePrompt = ({ children }: { children: string }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!revealed) {
    return (
      <a href="#" className="small" onClick={(e) => { e.preventDefault(); setRevealed(true); }}>
        <Sparkles size={14} className="me-1" />show me an example prompt
      </a>
    );
  }

  return (
    <div style={promptBlockStyle} onClick={handleCopy} title="Click to copy" className="mt-1">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <span>{children}</span>
        <span className="text-muted flex-shrink-0" style={{ fontSize: '0.75rem' }}>
          {copied ? 'Copied!' : <Copy size={14} />}
        </span>
      </div>
    </div>
  );
};

const StretchExercise = () => {
  const [showIntroAlert, setShowIntroAlert] = useState(true);

  return (
    <React.Fragment>
      <Helmet title="Stretch Exercise" />
      <Container fluid className="p-0">
        <h1 className="h3 mb-3">Stretch Exercise</h1>

        {showIntroAlert && (
          <Card className="mb-4 border-primary">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-2">Welcome to the Stretch Exercise!</h5>
                  <p className="mb-2">
                    You've built three separate features. Now go back and make them better — first
                    by tidying up, then by adding new functionality. The final challenge brings
                    everything together into one place.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowIntroAlert(false)}
                />
              </div>

              <div className="rounded p-3 mb-3" style={{ background: '#d1e7dd' }}>
                <strong>How it works:</strong> Same as before — describe what you want to Claude.
                These tasks require you to modify pages you've already built, so you'll see how
                AI handles changes to existing work. Example prompts are available if you need them.
              </div>

              <div className="rounded p-3 mb-3" style={{ background: '#cfe2ff' }}>
                <strong>What you'll learn:</strong> AI can refactor and improve code it wrote
                earlier just as easily as writing it the first time. You'll also see how it
                handles cross-cutting changes that touch multiple parts of the application at once.
              </div>

              {/* Section: Clean Up */}
              <h6 className="mb-3">Part 1: Clean Up</h6>
              <p className="text-muted mb-3">
                First, tidy up the exercise pages by removing the task instructions now that
                you've completed them.
              </p>

              <div className="mb-3">
                <div className="fw-semibold mb-1">1. Remove Task Instructions</div>
                <div className="mb-1">
                  Go back to the Task List, Car Park, and Analytics Chart pages and remove the
                  blue instruction cards at the top. The exercises are done — the pages should
                  just show the features you built.
                </div>
                <RevealablePrompt>Remove the instruction cards (the blue bordered cards with task lists) from the top of the Task List, Car Park, and Analytics Chart exercise pages. The pages should just show the working features without the setup instructions.</RevealablePrompt>
              </div>

              <hr />

              {/* Section: Task List Enhancements */}
              <h6 className="mb-3">Part 2: Enhance the Task List</h6>

              <div className="mb-3">
                <div className="fw-semibold mb-1">2. Task Filtering and Sorting</div>
                <div className="mb-1">
                  Add controls above the task boards that let users filter tasks by priority and
                  sort them by date or name. This should work across all three boards.
                </div>
              </div>

              <div className="mb-3">
                <div className="fw-semibold mb-1">3. Task Celebration</div>
                <div className="mb-1">
                  When a task is marked as complete, show a brief confetti animation or celebration
                  effect. Make completing tasks feel rewarding.
                </div>
              </div>

              <hr />

              {/* Section: Car Park Enhancements */}
              <h6 className="mb-3">Part 3: Enhance the Car Park</h6>

              <div className="mb-3">
                <div className="fw-semibold mb-1">4. Occupancy Over Time</div>
                <div className="mb-1">
                  Track when bays are booked and released, and add a chart to the car park page
                  that shows occupancy over time. You'll need to record timestamps in the database.
                </div>
              </div>

              <div className="mb-3">
                <div className="fw-semibold mb-1">5. Random Parking Chaos</div>
                <div className="mb-1">
                  Add a "Simulate Rush Hour" button to the car park page that randomly books and
                  releases bays over a few seconds, so you can watch the dashboard update in
                  real time.
                </div>
              </div>

              <hr />

              {/* Section: Analytics Enhancements */}
              <h6 className="mb-3">Part 4: Enhance the Analytics Chart</h6>

              <div className="mb-3">
                <div className="fw-semibold mb-1">6. Interactive Chart Controls</div>
                <div className="mb-1">
                  Add toggles above the chart that let users show or hide individual metrics
                  (page views, total visits, session duration). Add a date range selector to zoom
                  into specific months.
                </div>
              </div>

              <div className="mb-3">
                <div className="fw-semibold mb-1">7. Fun Facts Bar</div>
                <div className="mb-1">
                  Below the chart, add a row of cards showing fun computed stats — like the best
                  month for page views, the average session duration, the total visits for the
                  year, and a trend indicator (up or down vs previous month).
                </div>
              </div>

              <hr />

              {/* Section: Boss Challenge */}
              <h6 className="mb-3">Part 5: Boss Challenge — Command Centre</h6>

              <div className="rounded p-3 mb-3" style={{ background: '#fff3cd' }}>
                <strong>Final challenge:</strong> This task brings everything together. You'll
                build a new page that pulls data from all three exercises into a single dashboard.
              </div>

              <div className="mb-0">
                <div className="fw-semibold mb-1">8. Build the Command Centre</div>
                <div className="mb-1">
                  Create a new "Command Centre" page that combines all three exercises into a
                  single dashboard. It should show: a summary of tasks (how many in each status,
                  any overdue), live car park availability across all zones with the total number
                  of free bays, and a sparkline or mini chart of the analytics trend. Add it to
                  the sidebar navigation. Everything should be live — when you book a bay or
                  complete a task in the other pages, the command centre should reflect it.
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        <Row>
          <Col>
            <Card>
              <Card.Header>
                <Card.Title>Command Centre</Card.Title>
                <h6 className="card-subtitle text-muted">
                  Your unified dashboard will appear here after completing the boss challenge.
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="text-center text-muted py-4">
                  Complete the tasks above to build this feature.
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </React.Fragment>
  );
};

export default StretchExercise;
