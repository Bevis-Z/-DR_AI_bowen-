import React from 'react';
import { Card, CardContent, CardTitle } from "./ui/Card";
import RatingCircle from "./RatingCircle";

const HistoryAndDiagnosis = ({
  consultationHistory,
  diagnosis,
  hoveredDiagnosis,
  setHoveredDiagnosis
}) => {
  return (
    <div className="h-1/4 flex border-t">
      <div className="w-1/2 p-4 border-r">
        <Card className="h-full">
          <CardTitle>Consultation History</CardTitle>
          <CardContent className="overflow-y-auto">
            {consultationHistory ? (
              typeof consultationHistory === "string" ? (
                <p className="text-left p-2 rounded whitespace-pre-wrap">
                  {consultationHistory}
                </p>
              ) : (
                <div>
                  {consultationHistory.diagnosis && (
                    <div>
                      <h3 className="font-semibold mb-2">
                        Diagnosis
                      </h3>
                      <ul className="list-disc list-inside">
                        {Object.entries(
                          consultationHistory.diagnosis
                        ).map(([key, diag]) => (
                          <li key={key}>
                            <strong>
                              {diag.name}:
                            </strong>{" "}
                            {diag.justification}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            ) : (
              <span className="text-gray-400">
                No Content
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="w-1/2 p-4">
        <Card className="h-full">
          <CardTitle>Diagnosis</CardTitle>
          <CardContent className="overflow-y-auto">
            {diagnosis &&
              typeof diagnosis === "object" &&
              Object.keys(diagnosis).length > 0 ? (
              <div className="grid grid-cols-3 gap-4 px-4">
                {Object.entries(diagnosis)
                  .slice(0, 3)
                  .map(([key, value], index) => (
                    <div key={key} className="relative">
                      <Card className="bg-gray-100 p-3 rounded flex flex-col h-full">
                        <div className="flex items-center mb-2">
                          <a
                            href={value.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline overflow-hidden font-semibold text-sm truncate"
                          >
                            {value.name}
                          </a>
                        </div>
                        <div
                          className="flex items-center"
                          onMouseEnter={(event) => {
                            setHoveredDiagnosis({
                              key,
                              x: event.clientX,
                              y: event.clientY,
                            });
                          }}
                          onMouseLeave={() => setHoveredDiagnosis(null)}
                        >
                          <p
                            className="text-left text-xs text-gray-700 overflow-hidden line-clamp-3 flex-grow"
                            style={{
                              width: "calc(100% - 50px)",
                            }}
                          >
                            {value.justification}
                          </p>
                          <RatingCircle
                            rating={value.rating}
                            size={40}
                            className="flex-shrink-0 mr-2"
                          />
                        </div>
                      </Card>
                      {hoveredDiagnosis &&
                        hoveredDiagnosis.key === key && (
                          <div
                            className="fixed z-50 p-2 bg-white border rounded shadow-lg"
                            style={{
                              right: `${window.innerWidth -
                                hoveredDiagnosis.x +
                                10}px`,
                              bottom: `${window.innerHeight -
                                hoveredDiagnosis.y +
                                10}px`,
                              maxWidth: "300px",
                              width: "auto",
                            }}
                          >
                            <div className="flex flex-col justify-center items-center space-y-2">
                              <p className="text-sm font-semibold">
                                {value.name}
                              </p>
                              <RatingCircle rating={value.rating} />
                              <p className="text-sm">
                                {value.justification}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
              </div>
            ) : (
              <span className="text-gray-400">
                No diagnosis yet
              </span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HistoryAndDiagnosis;
